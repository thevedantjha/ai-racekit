import { elements as dom } from './dom.js';
import { parseTimeToSeconds, getAvg } from './utils.js';

export function populateFlagCheckboxesFromData(parsedLapDataRd1, parsedLapDataRd2 = []) {
    try {
        if (!parsedLapDataRd1 || parsedLapDataRd1.length === 0) {
            throw new Error('No Raceday 1 lap data provided to extract flags.');
        }

        const allFlagsRd1 = parsedLapDataRd1.map(row => row.FLAG_AT_FL).filter(Boolean);
        const allFlagsRd2 = parsedLapDataRd2.map(row => row.FLAG_AT_FL).filter(Boolean);
        
        const allFlags = [...new Set([...allFlagsRd1, ...allFlagsRd2])].sort();
        
        populateFlagCheckboxes(allFlags);
        return allFlags;

    } catch (error) {
        console.error('Failed to populate flag checkboxes from data:', error);
        dom.flagCheckboxes.innerHTML = `<p class="text-sm text-red-600">Could not extract flags: ${error.message}</p>`;
        return [];
    }
}

export function populateFlagCheckboxes(flags) {
    dom.flagCheckboxes.innerHTML = '';
    if (flags.length === 0) {
         dom.flagCheckboxes.innerHTML = '<p class="text-sm text-red-600">No "FLAG_AT_FL" data found in laps.</p>';
         return;
    }
    flags.forEach(flag => {
        const div = document.createElement('div');
        div.className = 'checkbox-group';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `flag_${flag}`;
        input.value = flag;
        input.name = 'lapFlag';
        input.checked = (flag === 'GF');
        const label = document.createElement('label');
        label.htmlFor = `flag_${flag}`;
        label.textContent = flag;
        div.appendChild(input);
        div.appendChild(label);
        dom.flagCheckboxes.appendChild(div);
    });
}

export function getSelectedFlags() {
    const selectedFlags = Array.from(document.querySelectorAll('#flagCheckboxes input:checked')).map(cb => cb.value);
    if (selectedFlags.length === 0) {
        throw new Error('Please select at least one lap flag type (e.g., GF) to analyze.');
    }
    return selectedFlags;
}

export function analyzeDriverData(resultsData, lapData, selectedFlags, excludePitLaps) {
    let sortedResults = resultsData
        .map(d => ({ ...d, POS_num: parseInt(d.POS) }))
        .filter(d => !isNaN(d.POS_num) && d.NUMBER)
        .sort((a, b) => a.POS_num - b.POS_num); 
    
    if (sortedResults.length === 0) throw new Error('No valid drivers found in results file.');

    const allElapsedTimes = resultsData.map(d => parseTimeToSeconds(d.ELAPSED)).filter(t => !isNaN(t) && t > 0);
    const maxOfficialRaceTime = allElapsedTimes.length > 0 ? Math.max(...allElapsedTimes) : null;

    const stats = {};
    const driverMap = {};
    sortedResults.forEach(driver => {
        stats[driver.NUMBER] = {
            s1: [], s2: [], s3: [], 
            pitStops: 0, 
            totalPitTime: 0,
            officialElapsedTime: parseTimeToSeconds(driver.ELAPSED)
        };
        driverMap[driver.NUMBER] = driver.POS_num; 
    });

    for (const row of lapData) {
        const driverNum = row.NUMBER;
        if (stats[driverNum]) {
            const pitTime = parseTimeToSeconds(row.PIT_TIME);
            const isPitLap = !isNaN(pitTime) && pitTime > 0;

            if (selectedFlags.includes(row.FLAG_AT_FL)) {
                if (!excludePitLaps || (excludePitLaps && !isPitLap)) {
                    const s1 = parseFloat(row.S1_SECONDS);
                    const s2 = parseFloat(row.S2_SECONDS);
                    const s3 = parseFloat(row.S3_SECONDS);
                    if (!isNaN(s1) && s1 > 0) stats[driverNum].s1.push(s1);
                    if (!isNaN(s2) && s2 > 0) stats[driverNum].s2.push(s2);
                    if (!isNaN(s3) && s3 > 0) stats[driverNum].s3.push(s3);
                }
            }

            if (isPitLap) {
                stats[driverNum].pitStops += 1;
                stats[driverNum].totalPitTime += pitTime;
            }
        }
    }
    
    let analysis = [];
    for (const driverNum in stats) {
        const driverStats = stats[driverNum];
        analysis.push({
            NUMBER: driverNum,
            POS: driverMap[driverNum], 
            S1_Avg: getAvg(driverStats.s1),
            S2_Avg: getAvg(driverStats.s2),
            S3_Avg: getAvg(driverStats.s3),
            Pit_Stops: driverStats.pitStops,
            Total_Pit_Time_s: driverStats.totalPitTime,
            Official_Elapsed_Time_s: driverStats.officialElapsedTime
        });
    }
    
    const filteredLapDrivers = analysis.filter(d => d.S1_Avg > 0 && d.S2_Avg > 0 && d.S3_Avg > 0);
    
    if (filteredLapDrivers.length > 0) {
        const field_S1_Avg = getAvg(filteredLapDrivers.map(d => d.S1_Avg));
        const field_S2_Avg = getAvg(filteredLapDrivers.map(d => d.S2_Avg));
        const field_S3_Avg = getAvg(filteredLapDrivers.map(d => d.S3_Avg));

        analysis.forEach(d => {
            d.S1_Diff = d.S1_Avg > 0 ? ((d.S1_Avg - field_S1_Avg) / field_S1_Avg) * 100 : null;
            d.S2_Diff = d.S2_Avg > 0 ? ((d.S2_Avg - field_S2_Avg) / field_S2_Avg) * 100 : null;
            d.S3_Diff = d.S3_Avg > 0 ? ((d.S3_Avg - field_S3_Avg) / field_S3_Avg) * 100 : null;
        });
    } else {
        analysis.forEach(d => {
            d.S1_Diff = null; d.S2_Diff = null; d.S3_Diff = null;
        });
    }
    
    analysis.sort((a, b) => a.POS - b.POS); 
    return { analysis, maxOfficialRaceTime, driverMap }; 
}

export function displayEvaluationResults(analysis, selectedFlags, excludePitLaps, racedayLabel = 'Raceday 1') {
    dom.summaryText.textContent = `Displaying combined average sector time of all drivers vs average sector time of each driver for all ${analysis.length} drivers, sorted by final position.`;
    dom.chartSubtitle.textContent = `(${racedayLabel} Data | Green is faster, Red is slower) | Laps: ${selectedFlags.join(', ')} | ${excludePitLaps ? 'Excluding pit laps' : 'Including pit laps'}`;
    
    createTable(analysis);
    return createCharts(analysis);
}

function createTable(analysis) {
    let table = `<table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th>Pos (Overall)</th>
                <th>Driver</th>
                <th>Avg. S1 (s)</th>
                <th>Avg. S2 (s)</th>
                <th>Avg. S3 (s)</th>
                <th>Pit Stops</th>
                <th>Total Pit Time (s)</th>
            </tr>
        </thead>
        <tbody>`;
    for (const row of analysis) {
        table += `
            <tr>
                <td>${row.POS}</td>
                <td>#${row.NUMBER}</td>
                <td>${row.S1_Avg > 0 ? row.S1_Avg.toFixed(3) : 'N/A'}</td>
                <td>${row.S2_Avg > 0 ? row.S2_Avg.toFixed(3) : 'N/A'}</td>
                <td>${row.S3_Avg > 0 ? row.S3_Avg.toFixed(3) : 'N/A'}</td>
                <td>${row.Pit_Stops}</td>
                <td>${row.Total_Pit_Time_s.toFixed(3)}</td>
            </tr>`;
    }
    table += `</tbody></table>`;
    dom.tableDiv.innerHTML = table;
}

function createCharts(analysis) {
    const driverLabels = analysis.map(d => `#${d.NUMBER} (POS ${d.POS})`); 
    const s1_diff = analysis.map(d => d.S1_Diff);
    const s2_diff = analysis.map(d => d.S2_Diff);
    const s3_diff = analysis.map(d => d.S3_Diff);
    const s1_avg = analysis.map(d => d.S1_Avg);
    const s2_avg = analysis.map(d => d.S2_Avg);
    const s3_avg = analysis.map(d => d.S3_Avg);

    const allDiffs = [...s1_diff, ...s2_diff, ...s3_diff].filter(v => v !== null && isFinite(v));
    const maxAbsDiff = allDiffs.length > 0 ? Math.ceil(Math.max(...allDiffs.map(Math.abs))) : 1;
    
    const chartHeight = Math.max(500, analysis.length * 30 + 120);
    [dom.chartContainerS1, dom.chartContainerS2, dom.chartContainerS3].forEach(c => c.style.height = `${chartHeight}px`);

    const commonOptions = (title) => ({
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        interaction: { mode: 'y', intersect: false },
        scales: {
            y: {
                reverse: false,
                ticks: { display: true, font: { size: 10 } }
            },
            x: {
                title: { display: true, text: '% Difference from Avg.' },
                min: -maxAbsDiff, max: maxAbsDiff
            }
        },
        plugins: {
            title: { display: true, text: title, font: { weight: 'bold', size: 16 } },
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const diff = context.raw;
                        if (diff === null || typeof diff === 'undefined') return 'N/A';
                        const avgTime = context.dataset.customData[context.dataIndex];
                        return `Diff: ${diff.toFixed(2)}% (Avg: ${avgTime > 0 ? avgTime.toFixed(3) : 'N/A'}s)`;
                    },
                    title: (context) => context[0].label
                }
            }
        }
    });

    const chartS1Instance = new Chart(dom.chartS1Canvas, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Sector 1', data: s1_diff, customData: s1_avg,
                backgroundColor: s1_diff.map(v => (v > 0) ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)'),
                borderColor: s1_diff.map(v => (v > 0) ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'),
                borderWidth: 1
            }]
        },
        options: commonOptions('Sector 1 Pace')
    });
    const chartS2Instance = new Chart(dom.chartS2Canvas, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Sector 2', data: s2_diff, customData: s2_avg,
                backgroundColor: s2_diff.map(v => (v > 0) ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)'),
                borderColor: s2_diff.map(v => (v > 0) ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'),
                borderWidth: 1
            }]
        },
        options: commonOptions('Sector 2 Pace')
    });
    const chartS3Instance = new Chart(dom.chartS3Canvas, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Sector 3', data: s3_diff, customData: s3_avg,
                backgroundColor: s3_diff.map(v => (v > 0) ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)'),
                borderColor: s3_diff.map(v => (v > 0) ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'),
                borderWidth: 1
            }]
        },
        options: commonOptions('Sector 3 Pace')
    });
    
    return { chartS1Instance, chartS2Instance, chartS3Instance };
}

