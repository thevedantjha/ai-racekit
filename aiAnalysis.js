import { elements as dom } from './dom.js';
import { parseTimeToSeconds, formatTime, getAvg, colors } from './utils.js';

let chartBestLapRaceInstanceRd1, chartConsistencyInstanceRd1, chartPitStopInstanceRd1;
let chartPaceVsPosInstanceRd1, chartPaceDegradationInstanceRd1, chartCostlyMistakeInstanceRd1, chartSectorFingerprintInstanceRd1;

let chartBestLapRaceInstanceRd2, chartConsistencyInstanceRd2, chartPitStopInstanceRd2;
let chartPaceVsPosInstanceRd2, chartPaceDegradationInstanceRd2, chartCostlyMistakeInstanceRd2, chartSectorFingerprintInstanceRd2;

let compPaceEvolutionInstance, compConsistencyDeltaInstance, compPaceQuadrantInstance;
let compSectorProfileEvolutionInstance, compRacecraftDeltaInstance;

export function destroyAiCharts() {
    if (chartBestLapRaceInstanceRd1) chartBestLapRaceInstanceRd1.destroy();
    if (chartConsistencyInstanceRd1) chartConsistencyInstanceRd1.destroy();
    if (chartPitStopInstanceRd1) chartPitStopInstanceRd1.destroy();
    if (chartPaceVsPosInstanceRd1) chartPaceVsPosInstanceRd1.destroy();
    if (chartPaceDegradationInstanceRd1) chartPaceDegradationInstanceRd1.destroy();
    if (chartCostlyMistakeInstanceRd1) chartCostlyMistakeInstanceRd1.destroy();
    if (chartSectorFingerprintInstanceRd1) chartSectorFingerprintInstanceRd1.destroy();

    if (chartBestLapRaceInstanceRd2) chartBestLapRaceInstanceRd2.destroy();
    if (chartConsistencyInstanceRd2) chartConsistencyInstanceRd2.destroy();
    if (chartPitStopInstanceRd2) chartPitStopInstanceRd2.destroy();
    if (chartPaceVsPosInstanceRd2) chartPaceVsPosInstanceRd2.destroy();
    if (chartPaceDegradationInstanceRd2) chartPaceDegradationInstanceRd2.destroy();
    if (chartCostlyMistakeInstanceRd2) chartCostlyMistakeInstanceRd2.destroy();
    if (chartSectorFingerprintInstanceRd2) chartSectorFingerprintInstanceRd2.destroy();

    if (compPaceEvolutionInstance) compPaceEvolutionInstance.destroy();
    if (compConsistencyDeltaInstance) compConsistencyDeltaInstance.destroy();
    if (compPaceQuadrantInstance) compPaceQuadrantInstance.destroy();
    if (compSectorProfileEvolutionInstance) compSectorProfileEvolutionInstance.destroy();
    if (compRacecraftDeltaInstance) compRacecraftDeltaInstance.destroy();
}

export function createAiAnalysesRd1(resultsData, lapData, analysisData) {
    const allTextDivs = [
        dom.aiBestLapTextDivRd1, dom.aiPaceVsPosTextRd1, dom.aiConsistencyTextDivRd1,
        dom.aiPaceDegradationTextRd1, dom.aiCostlyMistakeTextRd1, dom.aiPitStopTextDivRd1, dom.aiSectorFingerprintTextRd1
    ];
    allTextDivs.forEach(div => { if (div) div.innerHTML = '<p>Loading analysis...</p>'; });

    try {
        const winnerLaps = Math.max(...resultsData.map(d => parseInt(d.LAPS)).filter(l => !isNaN(l) && l > 0));
        if (isNaN(winnerLaps) || winnerLaps <= 0) {
            throw new Error("Could not determine valid lap count for race.");
        }

        const bestLapData = resultsData.map(d => {
            const bestLapTime_s = parseTimeToSeconds(d.BEST_LAP_TIME);
            const bestLapKph = parseFloat(d.BEST_LAP_KPH);
            const theoreticalTime_s = (bestLapTime_s > 0 && winnerLaps > 0) ? bestLapTime_s * winnerLaps : Infinity;
            
            return {
                number: d.NUMBER,
                actualPos: parseInt(d.POS),
                bestLapTime_s: bestLapTime_s,
                bestLapKph: isNaN(bestLapKph) ? 0 : bestLapKph,
                theoreticalTime_s: theoreticalTime_s
            };
        }).filter(d => d.theoreticalTime_s !== Infinity && d.number);

        bestLapData.sort((a, b) => a.theoreticalTime_s - b.theoreticalTime_s);
        bestLapData.forEach((d, i) => d.theoreticalRank = i + 1);

        chartBestLapRaceInstanceRd1 = createBestLapChartRd1(bestLapData);
        createBestLapLeaderboardRd1(bestLapData);
        generateBestLapTextRd1(bestLapData);

        chartPaceVsPosInstanceRd1 = createPaceVsPosChartRd1(bestLapData);
        generatePaceVsPosTextRd1(bestLapData);

        const combinedData = analysisData.map(driver => {
            const bestData = bestLapData.find(b => b.number === driver.NUMBER);
            const avgLapTime = (driver.S1_Avg > 0 && driver.S2_Avg > 0 && driver.S3_Avg > 0) 
                                ? (driver.S1_Avg + driver.S2_Avg + driver.S3_Avg) 
                                : NaN;
            const bestLapTime = bestData ? bestData.bestLapTime_s : NaN;
            const delta = (avgLapTime > 0 && bestLapTime > 0) ? (avgLapTime - bestLapTime) : NaN;
            return {
                ...driver,
                avgLapTime: avgLapTime,
                bestLapTime: bestLapTime,
                delta: delta,
            }
        }).sort((a,b) => a.POS - b.POS);
        
        chartConsistencyInstanceRd1 = createConsistencyChartRd1(combinedData);
        generateConsistencyTextRd1(combinedData, bestLapData, analysisData);

        const dataWithWorstLap = createCostlyMistakeAnalysisRd1(lapData, combinedData);

        populatePaceDegradationCheckboxesRd1(analysisData);
        createPaceDegradationAnalysisRd1(resultsData, lapData, analysisData);

        const driversWithPits = analysisData
            .filter(d => d.Pit_Stops > 0)
            .sort((a,b) => a.POS - b.POS);
        
        chartPitStopInstanceRd1 = createPitStopChartRd1(driversWithPits);
        generatePitStopTextRd1(driversWithPits, analysisData);

        populateSectorFingerprintDropdownRd1(analysisData);
        dom.aiSectorFingerprintTextRd1.innerHTML = '<p>Select a driver from the dropdown above to generate a profile.</p>';

        return {
            bestLapData,
            combinedData,
            dataWithWorstLap,
            driversWithPits
        };

    } catch (error) {
        console.error("Failed to create AI analysis (RD1):", error);
        const errorMsg = `<p class="text-red-600">Error generating AI analysis: ${error.message}</p>`;
        allTextDivs.forEach(div => { if (div) div.innerHTML = errorMsg; });
        return {};
    }
}

function createBestLapChartRd1(bestLapData) {
    const chartHeight = Math.max(500, bestLapData.length * 25 + 120);
    dom.chartBestLapRaceContainerRd1.style.height = `${chartHeight}px`;

    return new Chart(dom.chartBestLapRaceCanvasRd1, {
        type: 'bar',
        data: {
            labels: bestLapData.map(d => `#${d.number} (Actual POS ${d.actualPos})`),
            datasets: [{
                label: 'Theoretical Race Time',
                data: bestLapData.map(d => d.theoreticalTime_s),
                customData: bestLapData.map(d => d.bestLapTime_s),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: {
                    title: { display: true, text: 'Theoretical Total Race Time' },
                    ticks: { callback: (value) => formatTime(value) }
                }
            },
            plugins: {
                title: { display: true, text: 'Theoretical Race Finish (Sorted by Best Lap)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Theo. Time: ${formatTime(context.raw)}`,
                            `Best Lap: ${context.dataset.customData[context.dataIndex].toFixed(3)}s`
                        ],
                        title: (context) => context[0].label
                    }
                }
            }
        }
    });
}

function createBestLapLeaderboardRd1(bestLapData) {
    let table = `<table><thead><tr>
        <th>Rank</th><th>Car</th><th>Actual Pos</th><th>Best Lap (s)</th><th>Theo. Race Time</th>
        </tr></thead><tbody>`;
    for (const row of bestLapData) {
        table += `<tr>
            <td>${row.theoreticalRank}</td>
            <td>#${row.number}</td>
            <td>${row.actualPos}</td>
            <td style="font-family: monospace;">${row.bestLapTime_s.toFixed(3)}</td>
            <td style="font-family: monospace;">${formatTime(row.theoreticalTime_s)}</td>
            </tr>`;
    }
    table += `</tbody></table>`;
    dom.bestLapLeaderboardDivRd1.innerHTML = table;
}

function generateBestLapTextRd1(bestLapData) {
    let html = '';
    try {
        const fastestLapCar = bestLapData[0];
        const fastestKphCar = [...bestLapData].sort((a, b) => b.bestLapKph - a.bestLapKph)[0];

        html += '<h4>Top Speed vs. Lap Time</h4>';
        if (fastestLapCar.number === fastestKphCar.number) {
            html += `<p><strong>Dominant Pace:</strong> Driver <strong>#${fastestLapCar.number}</strong> (Actual P${fastestLapCar.actualPos}) was in a league of their own. They not only set the fastest potential lap of the race (${fastestLapCar.bestLapTime_s.toFixed(3)}s), but also achieved the highest average speed on that lap (SPEED: ${fastestKphCar.bestLapKph.toFixed(1)}).</p>`;
        } else {
            html += `<p><strong>Top Speed vs. Agility:</strong> While Driver <strong>#${fastestLapCar.number}</strong> (Actual P${fastestLapCar.actualPos}) set the fastest potential lap (${fastestLapCar.bestLapTime_s.toFixed(3)}s), it was Driver <strong>#${fastestKphCar.number}</strong> (Actual P${fastestKphCar.actualPos}) who recorded the highest average speed (SPEED: ${fastestKphCar.bestLapKph.toFixed(1)}).</p>`;
        }
         if (fastestLapCar.actualPos !== 1) {
             html += `<p><strong>Missed Opportunity:</strong> Despite having the fastest theoretical lap, Driver <strong>#${fastestLapCar.number}</strong> finished in <strong>P${fastestLapCar.actualPos}</strong>, suggesting significant issues during the race.</p>`
         }
    } catch (e) {
         html = `<p class="text-red-600">Error generating speed analysis: ${e.message}</p>`;
    }
    dom.aiBestLapTextDivRd1.innerHTML = html;
}

function createPaceVsPosChartRd1(bestLapData) {
    const sortedByPos = [...bestLapData].sort((a, b) => a.actualPos - b.actualPos);
    const chartHeight = Math.max(500, sortedByPos.length * 25 + 120);
    dom.chartPaceVsPosContainerRd1.style.height = `${chartHeight}px`;

    const driverLabels = sortedByPos.map(d => `#${d.number} (POS ${d.actualPos})`);
    const deltaData = sortedByPos.map(d => d.theoreticalRank - d.actualPos);
    
    return new Chart(dom.chartPaceVsPosCanvasRd1, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Positions Gained/Lost vs. Pace',
                data: deltaData,
                backgroundColor: deltaData.map(v => (v > 0) ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                borderColor: deltaData.map(v => (v > 0) ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Positions Gained (Overperform) / Lost (Underperform)' } }
            },
            plugins: {
                title: { display: true, text: 'Race Finish vs. Theoretical Pace Rank', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const delta = context.raw;
                            const label = delta > 0 ? `Overperformed by ${delta}` : `Underperformed by ${Math.abs(delta)}`;
                            const driverData = sortedByPos[context.dataIndex];
                            return `${label} pos. (Pace Rank: ${driverData.theoreticalRank})`;
                        }
                    }
                }
            }
        }
    });
}

function generatePaceVsPosTextRd1(bestLapData) {
    let html = '<h4>Key Performers</h4>';
    try {
        const sortedByDelta = [...bestLapData].map(d => ({...d, delta: d.theoreticalRank - d.actualPos})).sort((a, b) => b.delta - a.delta);
        const overperformer = sortedByDelta[0];
        const underperformer = sortedByDelta[sortedByDelta.length - 1];

        if (overperformer && overperformer.delta > 0) {
            html += `<p><strong>Top Overperformer:</strong> Driver <strong>#${overperformer.number}</strong> (Finished P${overperformer.actualPos}) finished <strong>${overperformer.delta}</strong> positions higher than their theoretical rank of P${overperformer.theoreticalRank}.</p>`;
        }
        if (underperformer && underperformer.delta < 0) {
            html += `<p><strong>Top Underperformer:</strong> Driver <strong>#${underperformer.number}</strong> (Finished P${underperformer.actualPos}) finished <strong>${Math.abs(underperformer.delta)}</strong> positions lower than their theoretical rank of P${underperformer.theoreticalRank}.</p>`;
        }
        
        const winner = bestLapData.find(d => d.actualPos === 1);
        if (winner && winner.theoreticalRank > 3) {
             html += `<p><strong>Race Winner:</strong> The winner, Driver <strong>#${winner.number}</strong>, won despite only having the ${winner.theoreticalRank}-fastest lap, a testament to a well-executed race.</p>`;
        }

    } catch (e) {
        html = `<p class="text-red-600">Error generating performer analysis: ${e.message}</p>`;
    }
    dom.aiPaceVsPosTextRd1.innerHTML = html;
}

function createConsistencyChartRd1(combinedData) {
    const validData = combinedData
        .filter(d => !isNaN(d.delta))
        .sort((a,b) => a.POS - b.POS);
    
    const chartHeight = Math.max(500, validData.length * 25 + 120);
    dom.chartConsistencyContainerRd1.style.height = `${chartHeight}px`;

    const driverLabels = validData.map(d => `#${d.NUMBER} (POS ${d.POS})`);
    const deltaData = validData.map(d => d.delta);
    const customData = validData.map(d => ({ avg: d.avgLapTime, best: d.bestLapTime }));

    return new Chart(dom.chartConsistencyCanvasRd1, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Gap (Avg - Best)',
                data: deltaData,
                customData: customData, 
                backgroundColor: 'rgba(234, 179, 8, 0.8)',
                borderColor: 'rgb(234, 179, 8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Gap (Avg. Lap - Best Lap) in Seconds' } }
            },
            plugins: {
                title: { display: true, text: 'Driver Consistency Gap (Sorted by Actual Finish)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Gap: ${context.raw.toFixed(3)}s`,
                            `Avg. Lap: ${context.dataset.customData[context.dataIndex].avg.toFixed(3)}s`,
                            `Best Lap: ${context.dataset.customData[context.dataIndex].best.toFixed(3)}s`
                        ],
                        title: (context) => context[0].label
                    }
                }
            }
        }
    });
}

function generateConsistencyTextRd1(combinedData, bestLapData, analysisData) {
    let html = '<h4>Key Driver Consistency</h4>';
    try {
        const validData = combinedData.filter(d => !isNaN(d.delta));
        if (validData.length === 0) {
            dom.aiConsistencyTextDivRd1.innerHTML = '<p>No valid consistency data could be calculated.</p>';
            return;
        }
        const driversWhoPitted = new Set(analysisData.filter(d => d.Pit_Stops > 0).map(d => d.NUMBER));
        const top3 = validData.filter(d => d.POS <= 3).sort((a,b) => a.POS - b.POS);
        const mostConsistentDriver = [...validData].sort((a, b) => a.delta - b.delta)[0];
        const analyzedDrivers = new Set();
        
        const analysisText = (driver, reason) => {
            if (!driver || analyzedDrivers.has(driver.NUMBER) || isNaN(driver.delta)) return '';
            analyzedDrivers.add(driver.NUMBER);
            let text = `<p><strong>${reason}, Driver #${driver.NUMBER} (Finished P${driver.POS}):</strong> `;
            text += `Showed a consistency gap of <strong>${driver.delta.toFixed(3)}s</strong>. `;
            if (driver.delta < 1.2) {
                text += "This is a solid, reliable performance.";
            } else {
                text += "This is a noticeable gap, suggesting struggles with traffic or mistakes.";
            }
            if (driversWhoPitted.has(driver.NUMBER)) {
                text += ` This gap was also influenced by their <strong>${driver.Pit_Stops} pit stop(s)</strong>.`;
                driversWhoPitted.delete(driver.NUMBER);
            }
            return text + `</p>`;
        };

        top3.forEach(driver => { html += analysisText(driver, `The P${driver.POS} finisher`); });
        if (mostConsistentDriver) { html += analysisText(mostConsistentDriver, "The most consistent driver"); }

    } catch (e) {
        html = `<p class="text-red-600">Error generating consistency analysis: ${e.message}</p>`;
    }
    dom.aiConsistencyTextDivRd1.innerHTML = html;
}

function populatePaceDegradationCheckboxesRd1(analysisData) {
    const container = dom.paceDegradationDriverSelectionRd1;
    container.innerHTML = '';
    dom.toggleSelectAllPaceDriversRd1.textContent = 'Select All';

    analysisData.sort((a,b) => a.POS - b.POS).forEach((driver, index) => {
        const label = document.createElement('label');
        label.htmlFor = `pace_driver_rd1_${driver.NUMBER}`;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `pace_driver_rd1_${driver.NUMBER}`;
        input.value = driver.NUMBER;
        input.dataset.color = colors[driver.POS % colors.length] || '#808080';
        if (index < 5) input.checked = true;
        const span = document.createElement('span');
        span.textContent = `#${driver.NUMBER}`;
        label.appendChild(input);
        label.appendChild(span);
        container.appendChild(label);
    });
}

export function createPaceDegradationAnalysisRd1(resultsData, lapData, analysisData) {
    try {
        const selectedDriverNumbers = Array.from(document.querySelectorAll('#paceDegradationDriverSelection-RD1 input:checked')).map(cb => cb.value);
        const selectedDriversSet = new Set(selectedDriverNumbers);
        
        if (selectedDriversSet.size === 0) {
            dom.aiPaceDegradationTextRd1.innerHTML = '<p>No drivers selected for pace degradation analysis.</p>';
            if (chartPaceDegradationInstanceRd1) {
                chartPaceDegradationInstanceRd1.data.datasets = [];
                chartPaceDegradationInstanceRd1.update();
            }
            return;
        }

        const winnerLaps = Math.max(...resultsData.map(d => parseInt(d.LAPS)).filter(l => !isNaN(l) && l > 0));
        if (isNaN(winnerLaps) || winnerLaps <= 0) throw new Error("Could not determine valid lap count.");
        
        const q1End = Math.floor(winnerLaps * 0.25);
        const q2End = Math.floor(winnerLaps * 0.50);
        const q3End = Math.floor(winnerLaps * 0.75);
        const paceByQuarter = {};

        for (const row of lapData) {
            const driverNum = row.NUMBER;
            if (!selectedDriversSet.has(driverNum)) continue; 
            const lapNum = parseInt(row.LAP_NUMBER);
            const flag = row.FLAG_AT_FL;
            const pitTime = parseTimeToSeconds(row.PIT_TIME);
            const lapTime = parseTimeToSeconds(row.LAP_TIME);

            if (isNaN(lapNum) || isNaN(lapTime) || lapTime <= 0 || flag !== 'GF' || (pitTime > 0)) continue;
            
            if (!paceByQuarter[driverNum]) {
                paceByQuarter[driverNum] = { q1: [], q2: [], q3: [], q4: [], pitInQ: 0, pos: analysisData.find(d=>d.NUMBER===driverNum).POS };
            }

            if (lapNum <= q1End) paceByQuarter[driverNum].q1.push(lapTime);
            else if (lapNum <= q2End) paceByQuarter[driverNum].q2.push(lapTime);
            else if (lapNum <= q3End) paceByQuarter[driverNum].q3.push(lapTime);
            else paceByQuarter[driverNum].q4.push(lapTime);
        }
        
        for (const row of lapData) {
             const driverNum = row.NUMBER;
             if (!selectedDriversSet.has(driverNum) || !paceByQuarter[driverNum]) continue;
             const lapNum = parseInt(row.LAP_NUMBER);
             const pitTime = parseTimeToSeconds(row.PIT_TIME);
             if (pitTime > 0) {
                 if (lapNum <= q1End) paceByQuarter[driverNum].pitInQ = 1;
                 else if (lapNum <= q2End) paceByQuarter[driverNum].pitInQ = 2;
                 else if (lapNum <= q3End) paceByQuarter[driverNum].pitInQ = 3;
                 else paceByQuarter[driverNum].pitInQ = 4;
             }
        }

        const datasets = [];
        const degradationDataForText = [];
        const sortedSelectedDrivers = Array.from(selectedDriversSet)
            .map(driverNum => ({ driverNum, data: paceByQuarter[driverNum] }))
            .filter(item => item.data)
            .sort((a, b) => a.data.pos - b.data.pos);

        sortedSelectedDrivers.forEach(({ driverNum, data }) => {
            const avgQ1 = getAvg(data.q1);
            const avgQ2 = getAvg(data.q2);
            const avgQ3 = getAvg(data.q3);
            const avgQ4 = getAvg(data.q4);
            degradationDataForText.push({ driverNum, pos: data.pos, avgQ1, avgQ4 });
            const driverColor = colors[data.pos % colors.length] || '#808080';
            
            datasets.push({
                label: `#${driverNum} (P${data.pos})`,
                data: [avgQ1, avgQ2, avgQ3, avgQ4],
                borderColor: driverColor,
                backgroundColor: driverColor,
                fill: false,
                tension: 0.1,
                pointRadius: 5,
                pointStyle: (ctx) => (data.pitInQ === (ctx.dataIndex + 1) ? 'rectRot' : 'circle'),
                pointBorderWidth: (ctx) => (data.pitInQ === (ctx.dataIndex + 1) ? 2 : 1),
                pointBorderColor: (ctx) => (data.pitInQ === (ctx.dataIndex + 1) ? '#000' : driverColor),
            });
        });

        createPaceDegradationChartRd1(datasets, paceByQuarter);
        generatePaceDegradationTextRd1(degradationDataForText);

    } catch (e) {
        console.error("Pace degradation analysis failed (RD1):", e);
        dom.aiPaceDegradationTextRd1.innerHTML = `<p class="text-red-600">Error generating pace degradation: ${e.message}</p>`;
    }
}

function createPaceDegradationChartRd1(datasets, paceByQuarter) {
    dom.chartPaceDegradationContainerRd1.style.height = '500px';
    if (chartPaceDegradationInstanceRd1) chartPaceDegradationInstanceRd1.destroy();

    chartPaceDegradationInstanceRd1 = new Chart(dom.chartPaceDegradationCanvasRd1, {
        type: 'line',
        data: {
            labels: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'Average Lap Time (s)' } },
                x: { title: { display: true, text: 'Race Segment' } }
            },
            plugins: {
                title: { display: true, text: 'Pace Degradation Analysis', font: { weight: 'bold', size: 16 } },
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const time = context.parsed.y;
                            let pitLabel = '';
                            const driverNumMatch = label.match(/#(\S+)/);
                            if (driverNumMatch) {
                                const driverNum = driverNumMatch[1];
                                const driverData = paceByQuarter[driverNum];
                                if (driverData && driverData.pitInQ === (context.dataIndex + 1)) {
                                    pitLabel = ' (Pit Stop)';
                                }
                            }
                            return `${label}: ${time > 0 ? time.toFixed(3) + 's' : 'N/A'}${pitLabel}`;
                        }
                    }
                }
            }
        }
    });
}

function generatePaceDegradationTextRd1(degradationData) {
     let html = '<h4>Degradation Insights</h4>';
     try {
         if (degradationData.length === 0) {
             dom.aiPaceDegradationTextRd1.innerHTML = '<p>Not enough data for pace degradation analysis.</p>';
             return;
         }
         degradationData.forEach(d => {
             const delta = d.avgQ4 - d.avgQ1;
             if (isNaN(delta) || d.avgQ1 === 0 || d.avgQ4 === 0) {
                 html += `<p><strong>Driver #${d.driverNum} (P${d.pos}):</strong> Not enough clean laps to analyze.</p>`;
             } else if (delta < 0) {
                 html += `<p><strong>Driver #${d.driverNum} (P${d.pos}):</strong> *Improved* by <strong>${Math.abs(delta).toFixed(3)}s</strong> from Q1 to Q4.</p>`;
             } else {
                 html += `<p><strong>Driver #${d.driverNum} (P${d.pos}):</strong> Faded by <strong>${delta.toFixed(3)}s</strong> from Q1 to Q4.</p>`;
             }
         });
      } catch (e) {
           html = `<p class="text-red-600">Error generating degradation text: ${e.message}</p>`;
       }
      dom.aiPaceDegradationTextRd1.innerHTML = html;
}

function createCostlyMistakeAnalysisRd1(lapData, combinedData) {
    let dataWithWorstLap = [];
    try {
        dataWithWorstLap = combinedData.map(driver => {
            const validGfNonPitLaps = [];
            for (const row of lapData) {
                if (row.NUMBER === driver.NUMBER) {
                    const lapTime = parseTimeToSeconds(row.LAP_TIME);
                    const flag = row.FLAG_AT_FL;
                    const pitTime = parseTimeToSeconds(row.PIT_TIME);
                    if (lapTime > 0 && flag === 'GF' && !(pitTime > 0)) {
                        validGfNonPitLaps.push(lapTime);
                    }
                }
            }
            if (validGfNonPitLaps.length === 0) {
                return { ...driver, worstLapDelta: NaN, avgLapTime: NaN, worstLapTime: NaN };
            }
            const avgLapTime = getAvg(validGfNonPitLaps);
            const worstLapTime = Math.max(...validGfNonPitLaps);
            const worstLapDelta = worstLapTime - avgLapTime;
            return { ...driver, avgLapTime, worstLapTime, worstLapDelta };
        });

        chartCostlyMistakeInstanceRd1 = createCostlyMistakeChartRd1(dataWithWorstLap);
        generateCostlyMistakeTextRd1(dataWithWorstLap);

    } catch (e) {
         console.error("Costly mistake analysis failed (RD1):", e);
         dom.aiCostlyMistakeTextRd1.innerHTML = `<p class="text-red-600">Error: ${e.message}</p>`;
    }
    return dataWithWorstLap;
}

function createCostlyMistakeChartRd1(dataWithWorstLap) {
    const validData = dataWithWorstLap
        .filter(d => !isNaN(d.worstLapDelta))
        .sort((a,b) => a.POS - b.POS);
    
    const chartHeight = Math.max(500, validData.length * 25 + 120);
    dom.chartCostlyMistakeContainerRd1.style.height = `${chartHeight}px`;

    const driverLabels = validData.map(d => `#${d.NUMBER} (POS ${d.POS})`);
    const deltaData = validData.map(d => d.worstLapDelta);
    const customData = validData.map(d => ({ avg: d.avgLapTime, worst: d.worstLapTime }));

    return new Chart(dom.chartCostlyMistakeCanvasRd1, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Time Lost (Worst - Avg)',
                data: deltaData,
                customData: customData, 
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Time Lost vs. Average (Seconds)' } }
            },
            plugins: {
                title: { display: true, text: 'Costly Mistake Delta (Sorted by Actual Finish)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Time Lost: ${context.raw.toFixed(3)}s`,
                            `Worst Lap: ${context.dataset.customData[context.dataIndex].worst.toFixed(3)}s`,
                            `Avg. (GF, non-pit): ${context.dataset.customData[context.dataIndex].avg.toFixed(3)}s`
                        ],
                        title: (context) => context[0].label
                    }
                }
            }
        }
    });
}

function generateCostlyMistakeTextRd1(dataWithWorstLap) {
    let html = '<h4>Clean Race Analysis</h4>';
    try {
        const validData = dataWithWorstLap.filter(d => !isNaN(d.worstLapDelta));
        if (validData.length === 0) {
            dom.aiCostlyMistakeTextRd1.innerHTML = '<p>Not enough valid laps to calculate.</p>';
            return;
        }
        const sortedByCleanest = [...validData].sort((a, b) => a.worstLapDelta - b.worstLapDelta);
        const cleanest = sortedByCleanest[0];
        const messiest = sortedByCleanest[sortedByCleanest.length - 1];
        
        if (cleanest) {
            html += `<p><strong>Cleanest Race:</strong> Driver <strong>#${cleanest.NUMBER}</strong> (P${cleanest.POS}) ran the cleanest race. Their single worst lap was only <strong>${cleanest.worstLapDelta.toFixed(3)}s</strong> slower than their average.</p>`;
        }
        if (messiest) {
            html += `<p><strong>Costliest Mistake:</strong> Driver <strong>#${messiest.NUMBER}</strong> (P${messiest.POS}) suffered at least one major error, losing <strong>${messiest.worstLapDelta.toFixed(3)}s</strong> on their worst lap.</p>`;
        }
    } catch(e) {
        html = `<p class="text-red-600">Error generating mistake analysis: ${e.message}</p>`;
    }
    dom.aiCostlyMistakeTextRd1.innerHTML = html;
}

function createPitStopChartRd1(driversWithPits) {
    const chartHeight = Math.max(400, driversWithPits.length * 30 + 120);
    dom.chartPitStopContainerRd1.style.height = `${chartHeight}px`;
    
    dom.chartPitStopContainerRd1.innerHTML = ''; 
    dom.chartPitStopContainerRd1.appendChild(dom.chartPitStopCanvasRd1);

    if (driversWithPits.length === 0) {
        dom.chartPitStopContainerRd1.innerHTML = '<p style="text-align: center; color: var(--color-text-muted);">No drivers made pit stops.</p>';
        if(chartPitStopInstanceRd1) chartPitStopInstanceRd1.destroy();
        return null;
    }

    const driverLabels = driversWithPits.map(d => `#${d.NUMBER} (POS ${d.POS})`);
    const pitTimeData = driversWithPits.map(d => d.Total_Pit_Time_s);
    const customData = driversWithPits.map(d => ({ stops: d.Pit_Stops, time: d.Total_Pit_Time_s }));

    if(chartPitStopInstanceRd1) chartPitStopInstanceRd1.destroy();
    return new Chart(dom.chartPitStopCanvasRd1, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Total Pit Time',
                data: pitTimeData,
                customData: customData, 
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Total Time in Pits (Seconds)' } }
            },
            plugins: {
                title: { display: true, text: 'Total Pit Time per Driver (Sorted by Actual Finish)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Total Time: ${context.dataset.customData[context.dataIndex].time.toFixed(3)}s`,
                            `Stops: ${context.dataset.customData[context.dataIndex].stops}`
                        ],
                        title: (context) => context[0].label
                    }
                }
            }
        }
    });
}

function generatePitStopTextRd1(driversWithPits, analysisData) {
    let html = '<h4>Pit Stop Analysis</h4>';
    try {
        if (driversWithPits.length === 0) {
            dom.aiPitStopTextDivRd1.innerHTML = '<p>No drivers made a pit stop.</p>';
            return;
        }
        if (driversWithPits.length === 1) {
            const singlePitter = driversWithPits[0];
            html += `<p>Only one driver, <strong>#${singlePitter.NUMBER}</strong> (P${singlePitter.POS}), made a pit stop, spending <strong>${singlePitter.Total_Pit_Time_s.toFixed(1)}s</strong> in the pits.</p>`;
        } 
        else {
            const sortedByTime = [...driversWithPits].sort((a,b) => a.Total_Pit_Time_s - b.Total_Pit_Time_s);
            const mostEfficient = sortedByTime[0];
            const leastEfficient = sortedByTime[sortedByTime.length - 1];
            html += `<p><strong>${driversWithPits.length}</strong> drivers made pit stops. 
                Driver <strong>#${mostEfficient.NUMBER}</strong> (P${mostEfficient.POS}) was most efficient (<strong>${mostEfficient.Total_Pit_Time_s.toFixed(1)}s</strong>). 
                Driver <strong>#${leastEfficient.NUMBER}</strong> (P${leastEfficient.POS}) spent the most time (<strong>${leastEfficient.Total_Pit_Time_s.toFixed(1)}s</strong>).</p>`;
        }
    } catch (e) {
        html = `<p class="text-red-600">Error generating pit stop analysis: ${e.message}</p>`;
    }
    dom.aiPitStopTextDivRd1.innerHTML = html;
}

function populateSectorFingerprintDropdownRd1(analysisData) {
    const container = dom.sectorFingerprintDriverSelectRd1;
    container.innerHTML = ''; 
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "-- Select a Driver --";
    container.appendChild(defaultOption);

    analysisData.sort((a,b) => a.POS - b.POS).forEach((driver, index) => {
        const option = document.createElement('option');
        option.value = driver.NUMBER;
        option.textContent = `#${driver.NUMBER} (P${driver.POS})`;
        container.appendChild(option);
    });
}

export function createSectorFingerprintAnalysisRd1(lapData, analysisData) {
    try {
        if (chartSectorFingerprintInstanceRd1) chartSectorFingerprintInstanceRd1.destroy();
        
        const selectedDriverNumber = dom.sectorFingerprintDriverSelectRd1.value;
        if (!selectedDriverNumber) {
            dom.aiSectorFingerprintTextRd1.innerHTML = '<p>Select a driver to generate a profile.</p>';
            return;
        }

        let fieldBestS1 = Infinity, fieldBestS2 = Infinity, fieldBestS3 = Infinity;
        const driverSectors = {};

        for (const row of lapData) {
            const flag = row.FLAG_AT_FL;
            const pitTime = parseTimeToSeconds(row.PIT_TIME);
            if (flag !== 'GF' || (pitTime > 0)) continue;

            const s1 = parseFloat(row.S1_SECONDS);
            const s2 = parseFloat(row.S2_SECONDS);
            const s3 = parseFloat(row.S3_SECONDS);
            if (s1 > 0) fieldBestS1 = Math.min(fieldBestS1, s1);
            if (s2 > 0) fieldBestS2 = Math.min(fieldBestS2, s2);
            if (s3 > 0) fieldBestS3 = Math.min(fieldBestS3, s3);
            
            const driverNum = row.NUMBER;
            if (!driverSectors[driverNum]) driverSectors[driverNum] = { s1: [], s2: [], s3: [] };
            if (s1 > 0) driverSectors[driverNum].s1.push(s1);
            if (s2 > 0) driverSectors[driverNum].s2.push(s2);
            if (s3 > 0) driverSectors[driverNum].s3.push(s3);
        }

        if (fieldBestS1 === Infinity) throw new Error("No valid S1 times found.");

        const driversToAnalyze = analysisData.filter(d => d.NUMBER === selectedDriverNumber);
        const datasets = [];
        const textData = [];
        let minPerf = 100;

        driversToAnalyze.forEach(driver => {
            const sectors = driverSectors[driver.NUMBER];
            if (!sectors) return;
            const avgS1 = getAvg(sectors.s1);
            const avgS2 = getAvg(sectors.s2);
            const avgS3 = getAvg(sectors.s3);
            const s1Perf = (avgS1 === 0 || fieldBestS1 === 0 || fieldBestS1 === Infinity) ? 0 : (fieldBestS1 / avgS1) * 100;
            const s2Perf = (avgS2 === 0 || fieldBestS2 === 0 || fieldBestS2 === Infinity) ? 0 : (fieldBestS2 / avgS2) * 100;
            const s3Perf = (avgS3 === 0 || fieldBestS3 === 0 || fieldBestS3 === Infinity) ? 0 : (fieldBestS3 / avgS3) * 100;
            if (s1Perf > 0) minPerf = Math.min(minPerf, s1Perf);
            if (s2Perf > 0) minPerf = Math.min(minPerf, s2Perf);
            if (s3Perf > 0) minPerf = Math.min(minPerf, s3Perf);
            textData.push({ driverNum: driver.NUMBER, pos: driver.POS, s1Perf, s2Perf, s3Perf });
            const driverColor = colors[driver.POS % colors.length] || '#808080';

            datasets.push({
                label: `#${driver.NUMBER} (P${driver.POS})`,
                data: [s1Perf, s2Perf, s3Perf],
                borderColor: driverColor,
                backgroundColor: driverColor.replace(')', ', 0.2)').replace('rgb', 'rgba'),
                fill: true,
            });
        });
        
        chartSectorFingerprintInstanceRd1 = createSectorFingerprintChartRd1(datasets, minPerf);
        generateSectorFingerprintTextRd1(textData);

    } catch (e) {
        console.error("Sector fingerprint analysis failed (RD1):", e);
        dom.aiSectorFingerprintTextRd1.innerHTML = `<p class="text-red-600">Error: ${e.message}</p>`;
    }
}

function createSectorFingerprintChartRd1(datasets, minPerf) {
    const newMin = Math.max(0, Math.floor(minPerf) - 5); 
    if (chartSectorFingerprintInstanceRd1) chartSectorFingerprintInstanceRd1.destroy();

    return new Chart(dom.chartSectorFingerprintCanvasRd1, {
        type: 'radar',
        data: {
            labels: ['Sector 1', 'Sector 2', 'Sector 3'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: newMin,
                    max: 100,
                    angleLines: { display: true },
                    ticks: { display: true, backdropColor: 'rgba(255, 255, 255, 0.75)' },
                    pointLabels: { font: { size: 14, weight: 'bold' } }
                }
            },
            plugins: {
                title: { display: true, text: 'Sector Strength Profile', font: { weight: 'bold', size: 16 } },
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label || ''}: ${context.raw.toFixed(2)}% (Avg vs. Field Best)`
                    }
                }
            }
        }
    });
}

function generateSectorFingerprintTextRd1(textData) {
    let html = '<h4>Strength Insights</h4>';
    try {
        if (textData.length === 0) {
            dom.aiSectorFingerprintTextRd1.innerHTML = '<p>Not enough data for analysis.</p>';
            return;
        }
        textData.forEach(d => {
            const strengths = [{n: 'S1', v: d.s1Perf}, {n: 'S2', v: d.s2Perf}, {n: 'S3', v: d.s3Perf}].sort((a,b) => b.v - a.v);
            const best = strengths[0];
            const worst = strengths[2];
            html += `<p><strong>Driver #${d.driverNum} (P${d.pos}):</strong> `;
            if (best.v > 99 && worst.v > 99) {
                html += `Was a true "all-rounder," matching the field's best pace in all sectors.`;
            } else {
                html += `Showed strength in <strong>${best.n}</strong> (${best.v.toFixed(1)}% of field best) and weakness in <strong>${worst.n}</strong> (${worst.v.toFixed(1)}%).`;
            }
            html += `</p>`;
        });
    } catch(e) {
         html = `<p class="text-red-600">Error generating fingerprint text: ${e.message}</p>`;
    }
    dom.aiSectorFingerprintTextRd1.innerHTML = html;
}


export function createAiAnalysesRd2(resultsData, lapData, analysisData) {
    const allTextDivs = [
        dom.aiBestLapTextDivRd2, dom.aiPaceVsPosTextRd2, dom.aiConsistencyTextDivRd2,
        dom.aiPaceDegradationTextRd2, dom.aiCostlyMistakeTextRd2, dom.aiPitStopTextDivRd2, dom.aiSectorFingerprintTextRd2
    ];
    allTextDivs.forEach(div => { if (div) div.innerHTML = '<p>Loading analysis...</p>'; });

    try {
        const winnerLaps = Math.max(...resultsData.map(d => parseInt(d.LAPS)).filter(l => !isNaN(l) && l > 0));
        if (isNaN(winnerLaps) || winnerLaps <= 0) {
            throw new Error("Could not determine valid lap count for race.");
        }

        const bestLapData = resultsData.map(d => {
            const bestLapTime_s = parseTimeToSeconds(d.BEST_LAP_TIME);
            const bestLapKph = parseFloat(d.BEST_LAP_KPH);
            const theoreticalTime_s = (bestLapTime_s > 0 && winnerLaps > 0) ? bestLapTime_s * winnerLaps : Infinity;
            
            return {
                number: d.NUMBER,
                actualPos: parseInt(d.POS),
                bestLapTime_s: bestLapTime_s,
                bestLapKph: isNaN(bestLapKph) ? 0 : bestLapKph,
                theoreticalTime_s: theoreticalTime_s
            };
        }).filter(d => d.theoreticalTime_s !== Infinity && d.number);

        bestLapData.sort((a, b) => a.theoreticalTime_s - b.theoreticalTime_s);
        bestLapData.forEach((d, i) => d.theoreticalRank = i + 1);

        chartBestLapRaceInstanceRd2 = createBestLapChartRd2(bestLapData);
        createBestLapLeaderboardRd2(bestLapData);
        generateBestLapTextRd2(bestLapData);

        chartPaceVsPosInstanceRd2 = createPaceVsPosChartRd2(bestLapData);
        generatePaceVsPosTextRd2(bestLapData);

        const combinedData = analysisData.map(driver => {
            const bestData = bestLapData.find(b => b.number === driver.NUMBER);
            const avgLapTime = (driver.S1_Avg > 0 && driver.S2_Avg > 0 && driver.S3_Avg > 0) 
                                ? (driver.S1_Avg + driver.S2_Avg + driver.S3_Avg) 
                                : NaN;
            const bestLapTime = bestData ? bestData.bestLapTime_s : NaN;
            const delta = (avgLapTime > 0 && bestLapTime > 0) ? (avgLapTime - bestLapTime) : NaN;
            return {
                ...driver,
                avgLapTime: avgLapTime,
                bestLapTime: bestLapTime,
                delta: delta,
            }
        }).sort((a,b) => a.POS - b.POS);
        
        chartConsistencyInstanceRd2 = createConsistencyChartRd2(combinedData);
        generateConsistencyTextRd2(combinedData, bestLapData, analysisData);

        const dataWithWorstLap = createCostlyMistakeAnalysisRd2(lapData, combinedData);

        populatePaceDegradationCheckboxesRd2(analysisData);
        createPaceDegradationAnalysisRd2(resultsData, lapData, analysisData);

        const driversWithPits = analysisData
            .filter(d => d.Pit_Stops > 0)
            .sort((a,b) => a.POS - b.POS);
        
        chartPitStopInstanceRd2 = createPitStopChartRd2(driversWithPits);
        generatePitStopTextRd2(driversWithPits, analysisData);

        populateSectorFingerprintDropdownRd2(analysisData);
        dom.aiSectorFingerprintTextRd2.innerHTML = '<p>Select a driver from the dropdown above to generate a profile.</p>';

        return {
            bestLapData,
            combinedData,
            dataWithWorstLap,
            driversWithPits
        };

    } catch (error) {
        console.error("Failed to create AI analysis (RD2):", error);
        const errorMsg = `<p class="text-red-600">Error generating AI analysis: ${error.message}</p>`;
        allTextDivs.forEach(div => { if (div) div.innerHTML = errorMsg; });
        return {};
    }
}

function createBestLapChartRd2(bestLapData) {
    const chartHeight = Math.max(500, bestLapData.length * 25 + 120);
    dom.chartBestLapRaceContainerRd2.style.height = `${chartHeight}px`;

    return new Chart(dom.chartBestLapRaceCanvasRd2, {
        type: 'bar',
        data: {
            labels: bestLapData.map(d => `#${d.number} (Actual POS ${d.actualPos})`),
            datasets: [{
                label: 'Theoretical Race Time',
                data: bestLapData.map(d => d.theoreticalTime_s),
                customData: bestLapData.map(d => d.bestLapTime_s),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: {
                    title: { display: true, text: 'Theoretical Total Race Time' },
                    ticks: { callback: (value) => formatTime(value) }
                }
            },
            plugins: {
                title: { display: true, text: 'Theoretical Race Finish (Sorted by Best Lap)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Theo. Time: ${formatTime(context.raw)}`,
                            `Best Lap: ${context.dataset.customData[context.dataIndex].toFixed(3)}s`
                        ],
                        title: (context) => context[0].label
                    }
                }
            }
        }
    });
}

function createBestLapLeaderboardRd2(bestLapData) {
    let table = `<table><thead><tr>
        <th>Rank</th><th>Car</th><th>Actual Pos</th><th>Best Lap (s)</th><th>Theo. Race Time</th>
        </tr></thead><tbody>`;
    for (const row of bestLapData) {
        table += `<tr>
            <td>${row.theoreticalRank}</td>
            <td>#${row.number}</td>
            <td>${row.actualPos}</td>
            <td style="font-family: monospace;">${row.bestLapTime_s.toFixed(3)}</td>
            <td style="font-family: monospace;">${formatTime(row.theoreticalTime_s)}</td>
            </tr>`;
    }
    table += `</tbody></table>`;
    dom.bestLapLeaderboardDivRd2.innerHTML = table;
}

function generateBestLapTextRd2(bestLapData) {
    let html = '';
    try {
        const fastestLapCar = bestLapData[0];
        const fastestKphCar = [...bestLapData].sort((a, b) => b.bestLapKph - a.bestLapKph)[0];

        html += '<h4>Top Speed vs. Lap Time</h4>';
        if (fastestLapCar.number === fastestKphCar.number) {
            html += `<p><strong>Dominant Pace:</strong> Driver <strong>#${fastestLapCar.number}</strong> (Actual P${fastestLapCar.actualPos}) was in a league of their own. They not only set the fastest potential lap of the race (${fastestLapCar.bestLapTime_s.toFixed(3)}s), but also achieved the highest average speed on that lap (SPEED: ${fastestKphCar.bestLapKph.toFixed(1)}).</p>`;
        } else {
            html += `<p><strong>Top Speed vs. Agility:</strong> While Driver <strong>#${fastestLapCar.number}</strong> (Actual P${fastestLapCar.actualPos}) set the fastest potential lap (${fastestLapCar.bestLapTime_s.toFixed(3)}s), it was Driver <strong>#${fastestKphCar.number}</strong> (Actual P${fastestKphCar.actualPos}) who recorded the highest average speed (SPEED: ${fastestKphCar.bestLapKph.toFixed(1)}).</p>`;
        }
         if (fastestLapCar.actualPos !== 1) {
             html += `<p><strong>Missed Opportunity:</strong> Despite having the fastest theoretical lap, Driver <strong>#${fastestLapCar.number}</strong> finished in <strong>P${fastestLapCar.actualPos}</strong>, suggesting significant issues during the race.</p>`
         }
    } catch (e) {
         html = `<p class="text-red-600">Error generating speed analysis: ${e.message}</p>`;
    }
    dom.aiBestLapTextDivRd2.innerHTML = html;
}

function createPaceVsPosChartRd2(bestLapData) {
    const sortedByPos = [...bestLapData].sort((a, b) => a.actualPos - b.actualPos);
    const chartHeight = Math.max(500, sortedByPos.length * 25 + 120);
    dom.chartPaceVsPosContainerRd2.style.height = `${chartHeight}px`;

    const driverLabels = sortedByPos.map(d => `#${d.number} (POS ${d.actualPos})`);
    const deltaData = sortedByPos.map(d => d.theoreticalRank - d.actualPos);
    
    return new Chart(dom.chartPaceVsPosCanvasRd2, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Positions Gained/Lost vs. Pace',
                data: deltaData,
                backgroundColor: deltaData.map(v => (v > 0) ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                borderColor: deltaData.map(v => (v > 0) ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Positions Gained (Overperform) / Lost (Underperform)' } }
            },
            plugins: {
                title: { display: true, text: 'Race Finish vs. Theoretical Pace Rank', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const delta = context.raw;
                            const label = delta > 0 ? `Overperformed by ${delta}` : `Underperformed by ${Math.abs(delta)}`;
                            const driverData = sortedByPos[context.dataIndex];
                            return `${label} pos. (Pace Rank: ${driverData.theoreticalRank})`;
                        }
                    }
                }
            }
        }
    });
}

function generatePaceVsPosTextRd2(bestLapData) {
    let html = '<h4>Key Performers</h4>';
    try {
        const sortedByDelta = [...bestLapData].map(d => ({...d, delta: d.theoreticalRank - d.actualPos})).sort((a, b) => b.delta - a.delta);
        const overperformer = sortedByDelta[0];
        const underperformer = sortedByDelta[sortedByDelta.length - 1];

        if (overperformer && overperformer.delta > 0) {
            html += `<p><strong>Top Overperformer:</strong> Driver <strong>#${overperformer.number}</strong> (Finished P${overperformer.actualPos}) finished <strong>${overperformer.delta}</strong> positions higher than their theoretical rank of P${overperformer.theoreticalRank}.</p>`;
        }
        if (underperformer && underperformer.delta < 0) {
            html += `<p><strong>Top Underperformer:</strong> Driver <strong>#${underperformer.number}</strong> (Finished P${underperformer.actualPos}) finished <strong>${Math.abs(underperformer.delta)}</strong> positions lower than their theoretical rank of P${underperformer.theoreticalRank}.</p>`;
        }
        
        const winner = bestLapData.find(d => d.actualPos === 1);
        if (winner && winner.theoreticalRank > 3) {
             html += `<p><strong>Race Winner:</strong> The winner, Driver <strong>#${winner.number}</strong>, won despite only having the ${winner.theoreticalRank}-fastest lap, a testament to a well-executed race.</p>`;
        }

    } catch (e) {
        html = `<p class="text-red-600">Error generating performer analysis: ${e.message}</p>`;
    }
    dom.aiPaceVsPosTextRd2.innerHTML = html;
}

function createConsistencyChartRd2(combinedData) {
    const validData = combinedData
        .filter(d => !isNaN(d.delta))
        .sort((a,b) => a.POS - b.POS);
    
    const chartHeight = Math.max(500, validData.length * 25 + 120);
    dom.chartConsistencyContainerRd2.style.height = `${chartHeight}px`;

    const driverLabels = validData.map(d => `#${d.NUMBER} (POS ${d.POS})`);
    const deltaData = validData.map(d => d.delta);
    const customData = validData.map(d => ({ avg: d.avgLapTime, best: d.bestLapTime }));

    return new Chart(dom.chartConsistencyCanvasRd2, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Gap (Avg - Best)',
                data: deltaData,
                customData: customData, 
                backgroundColor: 'rgba(234, 179, 8, 0.8)',
                borderColor: 'rgb(234, 179, 8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Gap (Avg. Lap - Best Lap) in Seconds' } }
            },
            plugins: {
                title: { display: true, text: 'Driver Consistency Gap (Sorted by Actual Finish)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Gap: ${context.raw.toFixed(3)}s`,
                            `Avg. Lap: ${context.dataset.customData[context.dataIndex].avg.toFixed(3)}s`,
                            `Best Lap: ${context.dataset.customData[context.dataIndex].best.toFixed(3)}s`
                        ],
                        title: (context) => context[0].label
                    }
                }
            }
        }
    });
}

function generateConsistencyTextRd2(combinedData, bestLapData, analysisData) {
    let html = '<h4>Key Driver Consistency</h4>';
    try {
        const validData = combinedData.filter(d => !isNaN(d.delta));
        if (validData.length === 0) {
            dom.aiConsistencyTextDivRd2.innerHTML = '<p>No valid consistency data could be calculated.</p>';
            return;
        }
        const driversWhoPitted = new Set(analysisData.filter(d => d.Pit_Stops > 0).map(d => d.NUMBER));
        const top3 = validData.filter(d => d.POS <= 3).sort((a,b) => a.POS - b.POS);
        const mostConsistentDriver = [...validData].sort((a, b) => a.delta - b.delta)[0];
        const analyzedDrivers = new Set();
        
        const analysisText = (driver, reason) => {
            if (!driver || analyzedDrivers.has(driver.NUMBER) || isNaN(driver.delta)) return '';
            analyzedDrivers.add(driver.NUMBER);
            let text = `<p><strong>${reason}, Driver #${driver.NUMBER} (Finished P${driver.POS}):</strong> `;
            text += `Showed a consistency gap of <strong>${driver.delta.toFixed(3)}s</strong>. `;
            if (driver.delta < 1.2) {
                text += "This is a solid, reliable performance.";
            } else {
                text += "This is a noticeable gap, suggesting struggles with traffic or mistakes.";
            }
            if (driversWhoPitted.has(driver.NUMBER)) {
                text += ` This gap was also influenced by their <strong>${driver.Pit_Stops} pit stop(s)</strong>.`;
                driversWhoPitted.delete(driver.NUMBER);
            }
            return text + `</p>`;
        };

        top3.forEach(driver => { html += analysisText(driver, `The P${driver.POS} finisher`); });
        if (mostConsistentDriver) { html += analysisText(mostConsistentDriver, "The most consistent driver"); }

    } catch (e) {
        html = `<p class="text-red-600">Error generating consistency analysis: ${e.message}</p>`;
    }
    dom.aiConsistencyTextDivRd2.innerHTML = html;
}

function populatePaceDegradationCheckboxesRd2(analysisData) {
    const container = dom.paceDegradationDriverSelectionRd2;
    container.innerHTML = '';
    dom.toggleSelectAllPaceDriversRd2.textContent = 'Select All';

    analysisData.sort((a,b) => a.POS - b.POS).forEach((driver, index) => {
        const label = document.createElement('label');
        label.htmlFor = `pace_driver_rd2_${driver.NUMBER}`;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `pace_driver_rd2_${driver.NUMBER}`;
        input.value = driver.NUMBER;
        input.dataset.color = colors[driver.POS % colors.length] || '#808080';
        if (index < 5) input.checked = true;
        const span = document.createElement('span');
        span.textContent = `#${driver.NUMBER}`;
        label.appendChild(input);
        label.appendChild(span);
        container.appendChild(label);
    });
}

export function createPaceDegradationAnalysisRd2(resultsData, lapData, analysisData) {
    try {
        const selectedDriverNumbers = Array.from(document.querySelectorAll('#paceDegradationDriverSelection-RD2 input:checked')).map(cb => cb.value);
        const selectedDriversSet = new Set(selectedDriverNumbers);
        
        if (selectedDriversSet.size === 0) {
            dom.aiPaceDegradationTextRd2.innerHTML = '<p>No drivers selected for pace degradation analysis.</p>';
            if (chartPaceDegradationInstanceRd2) {
                chartPaceDegradationInstanceRd2.data.datasets = [];
                chartPaceDegradationInstanceRd2.update();
            }
            return;
        }

        const winnerLaps = Math.max(...resultsData.map(d => parseInt(d.LAPS)).filter(l => !isNaN(l) && l > 0));
        if (isNaN(winnerLaps) || winnerLaps <= 0) throw new Error("Could not determine valid lap count.");
        
        const q1End = Math.floor(winnerLaps * 0.25);
        const q2End = Math.floor(winnerLaps * 0.50);
        const q3End = Math.floor(winnerLaps * 0.75);
        const paceByQuarter = {};

        for (const row of lapData) {
            const driverNum = row.NUMBER;
            if (!selectedDriversSet.has(driverNum)) continue; 
            const lapNum = parseInt(row.LAP_NUMBER);
            const flag = row.FLAG_AT_FL;
            const pitTime = parseTimeToSeconds(row.PIT_TIME);
            const lapTime = parseTimeToSeconds(row.LAP_TIME);

            if (isNaN(lapNum) || isNaN(lapTime) || lapTime <= 0 || flag !== 'GF' || (pitTime > 0)) continue;
            
            if (!paceByQuarter[driverNum]) {
                paceByQuarter[driverNum] = { q1: [], q2: [], q3: [], q4: [], pitInQ: 0, pos: analysisData.find(d=>d.NUMBER===driverNum).POS };
            }

            if (lapNum <= q1End) paceByQuarter[driverNum].q1.push(lapTime);
            else if (lapNum <= q2End) paceByQuarter[driverNum].q2.push(lapTime);
            else if (lapNum <= q3End) paceByQuarter[driverNum].q3.push(lapTime);
            else paceByQuarter[driverNum].q4.push(lapTime);
        }
        
        for (const row of lapData) {
             const driverNum = row.NUMBER;
             if (!selectedDriversSet.has(driverNum) || !paceByQuarter[driverNum]) continue;
             const lapNum = parseInt(row.LAP_NUMBER);
             const pitTime = parseTimeToSeconds(row.PIT_TIME);
             if (pitTime > 0) {
                 if (lapNum <= q1End) paceByQuarter[driverNum].pitInQ = 1;
                 else if (lapNum <= q2End) paceByQuarter[driverNum].pitInQ = 2;
                 else if (lapNum <= q3End) paceByQuarter[driverNum].pitInQ = 3;
                 else paceByQuarter[driverNum].pitInQ = 4;
             }
        }

        const datasets = [];
        const degradationDataForText = [];
        const sortedSelectedDrivers = Array.from(selectedDriversSet)
            .map(driverNum => ({ driverNum, data: paceByQuarter[driverNum] }))
            .filter(item => item.data)
            .sort((a, b) => a.data.pos - b.data.pos);

        sortedSelectedDrivers.forEach(({ driverNum, data }) => {
            const avgQ1 = getAvg(data.q1);
            const avgQ2 = getAvg(data.q2);
            const avgQ3 = getAvg(data.q3);
            const avgQ4 = getAvg(data.q4);
            degradationDataForText.push({ driverNum, pos: data.pos, avgQ1, avgQ4 });
            const driverColor = colors[data.pos % colors.length] || '#808080';
            
            datasets.push({
                label: `#${driverNum} (P${data.pos})`,
                data: [avgQ1, avgQ2, avgQ3, avgQ4],
                borderColor: driverColor,
                backgroundColor: driverColor,
                fill: false,
                tension: 0.1,
                pointRadius: 5,
                pointStyle: (ctx) => (data.pitInQ === (ctx.dataIndex + 1) ? 'rectRot' : 'circle'),
                pointBorderWidth: (ctx) => (data.pitInQ === (ctx.dataIndex + 1) ? 2 : 1),
                pointBorderColor: (ctx) => (data.pitInQ === (ctx.dataIndex + 1) ? '#000' : driverColor),
            });
        });

        createPaceDegradationChartRd2(datasets, paceByQuarter);
        generatePaceDegradationTextRd2(degradationDataForText);

    } catch (e) {
        console.error("Pace degradation analysis failed (RD2):", e);
        dom.aiPaceDegradationTextRd2.innerHTML = `<p class="text-red-600">Error generating pace degradation: ${e.message}</p>`;
    }
}

function createPaceDegradationChartRd2(datasets, paceByQuarter) {
    dom.chartPaceDegradationContainerRd2.style.height = '500px';
    if (chartPaceDegradationInstanceRd2) chartPaceDegradationInstanceRd2.destroy();

    chartPaceDegradationInstanceRd2 = new Chart(dom.chartPaceDegradationCanvasRd2, {
        type: 'line',
        data: {
            labels: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'Average Lap Time (s)' } },
                x: { title: { display: true, text: 'Race Segment' } }
            },
            plugins: {
                title: { display: true, text: 'Pace Degradation Analysis', font: { weight: 'bold', size: 16 } },
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const time = context.parsed.y;
                            let pitLabel = '';
                            const driverNumMatch = label.match(/#(\S+)/);
                            if (driverNumMatch) {
                                const driverNum = driverNumMatch[1];
                                const driverData = paceByQuarter[driverNum];
                                if (driverData && driverData.pitInQ === (context.dataIndex + 1)) {
                                    pitLabel = ' (Pit Stop)';
                                }
                            }
                            return `${label}: ${time > 0 ? time.toFixed(3) + 's' : 'N/A'}${pitLabel}`;
                        }
                    }
                }
            }
        }
    });
}

function generatePaceDegradationTextRd2(degradationData) {
     let html = '<h4>Degradation Insights</h4>';
     try {
         if (degradationData.length === 0) {
             dom.aiPaceDegradationTextRd2.innerHTML = '<p>Not enough data for pace degradation analysis.</p>';
             return;
         }
         degradationData.forEach(d => {
             const delta = d.avgQ4 - d.avgQ1;
             if (isNaN(delta) || d.avgQ1 === 0 || d.avgQ4 === 0) {
                 html += `<p><strong>Driver #${d.driverNum} (P${d.pos}):</strong> Not enough clean laps to analyze.</p>`;
             } else if (delta < 0) {
                 html += `<p><strong>Driver #${d.driverNum} (P${d.pos}):</strong> *Improved* by <strong>${Math.abs(delta).toFixed(3)}s</strong> from Q1 to Q4.</p>`;
             } else {
                 html += `<p><strong>Driver #${d.driverNum} (P${d.pos}):</strong> Faded by <strong>${delta.toFixed(3)}s</strong> from Q1 to Q4.</p>`;
             }
         });
      } catch (e) {
           html = `<p class="text-red-600">Error generating degradation text: ${e.message}</p>`;
       }
      dom.aiPaceDegradationTextRd2.innerHTML = html;
}

function createCostlyMistakeAnalysisRd2(lapData, combinedData) {
    let dataWithWorstLap = [];
    try {
        dataWithWorstLap = combinedData.map(driver => {
            const validGfNonPitLaps = [];
            for (const row of lapData) {
                if (row.NUMBER === driver.NUMBER) {
                    const lapTime = parseTimeToSeconds(row.LAP_TIME);
                    const flag = row.FLAG_AT_FL;
                    const pitTime = parseTimeToSeconds(row.PIT_TIME);
                    if (lapTime > 0 && flag === 'GF' && !(pitTime > 0)) {
                        validGfNonPitLaps.push(lapTime);
                    }
                }
            }
            if (validGfNonPitLaps.length === 0) {
                return { ...driver, worstLapDelta: NaN, avgLapTime: NaN, worstLapTime: NaN };
            }
            const avgLapTime = getAvg(validGfNonPitLaps);
            const worstLapTime = Math.max(...validGfNonPitLaps);
            const worstLapDelta = worstLapTime - avgLapTime;
            return { ...driver, avgLapTime, worstLapTime, worstLapDelta };
        });

        chartCostlyMistakeInstanceRd2 = createCostlyMistakeChartRd2(dataWithWorstLap);
        generateCostlyMistakeTextRd2(dataWithWorstLap);

    } catch (e) {
         console.error("Costly mistake analysis failed (RD2):", e);
         dom.aiCostlyMistakeTextRd2.innerHTML = `<p class="text-red-600">Error: ${e.message}</p>`;
    }
    return dataWithWorstLap;
}

function createCostlyMistakeChartRd2(dataWithWorstLap) {
    const validData = dataWithWorstLap
        .filter(d => !isNaN(d.worstLapDelta))
        .sort((a,b) => a.POS - b.POS);
    
    const chartHeight = Math.max(500, validData.length * 25 + 120);
    dom.chartCostlyMistakeContainerRd2.style.height = `${chartHeight}px`;

    const driverLabels = validData.map(d => `#${d.NUMBER} (POS ${d.POS})`);
    const deltaData = validData.map(d => d.worstLapDelta);
    const customData = validData.map(d => ({ avg: d.avgLapTime, worst: d.worstLapTime }));

    return new Chart(dom.chartCostlyMistakeCanvasRd2, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Time Lost (Worst - Avg)',
                data: deltaData,
                customData: customData, 
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Time Lost vs. Average (Seconds)' } }
            },
            plugins: {
                title: { display: true, text: 'Costly Mistake Delta (Sorted by Actual Finish)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Time Lost: ${context.raw.toFixed(3)}s`,
                            `Worst Lap: ${context.dataset.customData[context.dataIndex].worst.toFixed(3)}s`,
                            `Avg. (GF, non-pit): ${context.dataset.customData[context.dataIndex].avg.toFixed(3)}s`
                        ],
                        title: (context) => context[0].label
                    }
                }
            }
        }
    });
}

function generateCostlyMistakeTextRd2(dataWithWorstLap) {
    let html = '<h4>Clean Race Analysis</h4>';
    try {
        const validData = dataWithWorstLap.filter(d => !isNaN(d.worstLapDelta));
        if (validData.length === 0) {
            dom.aiCostlyMistakeTextRd2.innerHTML = '<p>Not enough valid laps to calculate.</p>';
            return;
        }
        const sortedByCleanest = [...validData].sort((a, b) => a.worstLapDelta - b.worstLapDelta);
        const cleanest = sortedByCleanest[0];
        const messiest = sortedByCleanest[sortedByCleanest.length - 1];
        
        if (cleanest) {
            html += `<p><strong>Cleanest Race:</strong> Driver <strong>#${cleanest.NUMBER}</strong> (P${cleanest.POS}) ran the cleanest race. Their single worst lap was only <strong>${cleanest.worstLapDelta.toFixed(3)}s</strong> slower than their average.</p>`;
        }
        if (messiest) {
            html += `<p><strong>Costliest Mistake:</strong> Driver <strong>#${messiest.NUMBER}</strong> (P${messiest.POS}) suffered at least one major error, losing <strong>${messiest.worstLapDelta.toFixed(3)}s</strong> on their worst lap.</p>`;
        }
    } catch(e) {
        html = `<p class="text-red-600">Error generating mistake analysis: ${e.message}</p>`;
    }
    dom.aiCostlyMistakeTextRd2.innerHTML = html;
}

function createPitStopChartRd2(driversWithPits) {
    const chartHeight = Math.max(400, driversWithPits.length * 30 + 120);
    dom.chartPitStopContainerRd2.style.height = `${chartHeight}px`;
    
    dom.chartPitStopContainerRd2.innerHTML = ''; 
    dom.chartPitStopContainerRd2.appendChild(dom.chartPitStopCanvasRd2);

    if (driversWithPits.length === 0) {
        dom.chartPitStopContainerRd2.innerHTML = '<p style="text-align: center; color: var(--color-text-muted);">No drivers made pit stops.</p>';
        if(chartPitStopInstanceRd2) chartPitStopInstanceRd2.destroy();
        return null;
    }

    const driverLabels = driversWithPits.map(d => `#${d.NUMBER} (POS ${d.POS})`);
    const pitTimeData = driversWithPits.map(d => d.Total_Pit_Time_s);
    const customData = driversWithPits.map(d => ({ stops: d.Pit_Stops, time: d.Total_Pit_Time_s }));

    if(chartPitStopInstanceRd2) chartPitStopInstanceRd2.destroy();
    return new Chart(dom.chartPitStopCanvasRd2, {
        type: 'bar',
        data: {
            labels: driverLabels,
            datasets: [{
                label: 'Total Pit Time',
                data: pitTimeData,
                customData: customData, 
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: 'rgb(139, 92, 246)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Total Time in Pits (Seconds)' } }
            },
            plugins: {
                title: { display: true, text: 'Total Pit Time per Driver (Sorted by Actual Finish)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Total Time: ${context.dataset.customData[context.dataIndex].time.toFixed(3)}s`,
                            `Stops: ${context.dataset.customData[context.dataIndex].stops}`
                        ],
                        title: (context) => context[0].label
                    }
                }
            }
        }
    });
}

function generatePitStopTextRd2(driversWithPits, analysisData) {
    let html = '<h4>Pit Stop Analysis</h4>';
    try {
        if (driversWithPits.length === 0) {
            dom.aiPitStopTextDivRd2.innerHTML = '<p>No drivers made a pit stop.</p>';
            return;
        }
        if (driversWithPits.length === 1) {
            const singlePitter = driversWithPits[0];
            html += `<p>Only one driver, <strong>#${singlePitter.NUMBER}</strong> (P${singlePitter.POS}), made a pit stop, spending <strong>${singlePitter.Total_Pit_Time_s.toFixed(1)}s</strong> in the pits.</p>`;
        } 
        else {
            const sortedByTime = [...driversWithPits].sort((a,b) => a.Total_Pit_Time_s - b.Total_Pit_Time_s);
            const mostEfficient = sortedByTime[0];
            const leastEfficient = sortedByTime[sortedByTime.length - 1];
            html += `<p><strong>${driversWithPits.length}</strong> drivers made pit stops. 
                Driver <strong>#${mostEfficient.NUMBER}</strong> (P${mostEfficient.POS}) was most efficient (<strong>${mostEfficient.Total_Pit_Time_s.toFixed(1)}s</strong>). 
                Driver <strong>#${leastEfficient.NUMBER}</strong> (P${leastEfficient.POS}) spent the most time (<strong>${leastEfficient.Total_Pit_Time_s.toFixed(1)}s</strong>).</p>`;
        }
    } catch (e) {
        html = `<p class="text-red-600">Error generating pit stop analysis: ${e.message}</p>`;
    }
    dom.aiPitStopTextDivRd2.innerHTML = html;
}

function populateSectorFingerprintDropdownRd2(analysisData) {
    const container = dom.sectorFingerprintDriverSelectRd2;
    container.innerHTML = ''; 
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "-- Select a Driver --";
    container.appendChild(defaultOption);

    analysisData.sort((a,b) => a.POS - b.POS).forEach((driver, index) => {
        const option = document.createElement('option');
        option.value = driver.NUMBER;
        option.textContent = `#${driver.NUMBER} (P${driver.POS})`;
        container.appendChild(option);
    });
}

export function createSectorFingerprintAnalysisRd2(lapData, analysisData) {
    try {
        if (chartSectorFingerprintInstanceRd2) chartSectorFingerprintInstanceRd2.destroy();
        
        const selectedDriverNumber = dom.sectorFingerprintDriverSelectRd2.value;
        if (!selectedDriverNumber) {
            dom.aiSectorFingerprintTextRd2.innerHTML = '<p>Select a driver to generate a profile.</p>';
            return;
        }

        let fieldBestS1 = Infinity, fieldBestS2 = Infinity, fieldBestS3 = Infinity;
        const driverSectors = {};

        for (const row of lapData) {
            const flag = row.FLAG_AT_FL;
            const pitTime = parseTimeToSeconds(row.PIT_TIME);
            if (flag !== 'GF' || (pitTime > 0)) continue;

            const s1 = parseFloat(row.S1_SECONDS);
            const s2 = parseFloat(row.S2_SECONDS);
            const s3 = parseFloat(row.S3_SECONDS);
            if (s1 > 0) fieldBestS1 = Math.min(fieldBestS1, s1);
            if (s2 > 0) fieldBestS2 = Math.min(fieldBestS2, s2);
            if (s3 > 0) fieldBestS3 = Math.min(fieldBestS3, s3);
            
            const driverNum = row.NUMBER;
            if (!driverSectors[driverNum]) driverSectors[driverNum] = { s1: [], s2: [], s3: [] };
            if (s1 > 0) driverSectors[driverNum].s1.push(s1);
            if (s2 > 0) driverSectors[driverNum].s2.push(s2);
            if (s3 > 0) driverSectors[driverNum].s3.push(s3);
        }

        if (fieldBestS1 === Infinity) throw new Error("No valid S1 times found.");

        const driversToAnalyze = analysisData.filter(d => d.NUMBER === selectedDriverNumber);
        const datasets = [];
        const textData = [];
        let minPerf = 100;

        driversToAnalyze.forEach(driver => {
            const sectors = driverSectors[driver.NUMBER];
            if (!sectors) return;
            const avgS1 = getAvg(sectors.s1);
            const avgS2 = getAvg(sectors.s2);
            const avgS3 = getAvg(sectors.s3);
            const s1Perf = (avgS1 === 0 || fieldBestS1 === 0 || fieldBestS1 === Infinity) ? 0 : (fieldBestS1 / avgS1) * 100;
            const s2Perf = (avgS2 === 0 || fieldBestS2 === 0 || fieldBestS2 === Infinity) ? 0 : (fieldBestS2 / avgS2) * 100;
            const s3Perf = (avgS3 === 0 || fieldBestS3 === 0 || fieldBestS3 === Infinity) ? 0 : (fieldBestS3 / avgS3) * 100;
            if (s1Perf > 0) minPerf = Math.min(minPerf, s1Perf);
            if (s2Perf > 0) minPerf = Math.min(minPerf, s2Perf);
            if (s3Perf > 0) minPerf = Math.min(minPerf, s3Perf);
            textData.push({ driverNum: driver.NUMBER, pos: driver.POS, s1Perf, s2Perf, s3Perf });
            const driverColor = colors[driver.POS % colors.length] || '#808080';

            datasets.push({
                label: `#${driver.NUMBER} (P${driver.POS})`,
                data: [s1Perf, s2Perf, s3Perf],
                borderColor: driverColor,
                backgroundColor: driverColor.replace(')', ', 0.2)').replace('rgb', 'rgba'),
                fill: true,
            });
        });
        
        chartSectorFingerprintInstanceRd2 = createSectorFingerprintChartRd2(datasets, minPerf);
        generateSectorFingerprintTextRd2(textData);

    } catch (e) {
        console.error("Sector fingerprint analysis failed (RD2):", e);
        dom.aiSectorFingerprintTextRd2.innerHTML = `<p class="text-red-600">Error: ${e.message}</p>`;
    }
}

function createSectorFingerprintChartRd2(datasets, minPerf) {
    const newMin = Math.max(0, Math.floor(minPerf) - 5); 
    if (chartSectorFingerprintInstanceRd2) chartSectorFingerprintInstanceRd2.destroy();

    return new Chart(dom.chartSectorFingerprintCanvasRd2, {
        type: 'radar',
        data: {
            labels: ['Sector 1', 'Sector 2', 'Sector 3'],
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: newMin,
                    max: 100,
                    angleLines: { display: true },
                    ticks: { display: true, backdropColor: 'rgba(255, 255, 255, 0.75)' },
                    pointLabels: { font: { size: 14, weight: 'bold' } }
                }
            },
            plugins: {
                title: { display: true, text: 'Sector Strength Profile', font: { weight: 'bold', size: 16 } },
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label || ''}: ${context.raw.toFixed(2)}% (Avg vs. Field Best)`
                    }
                }
            }
        }
    });
}

function generateSectorFingerprintTextRd2(textData) {
    let html = '<h4>Strength Insights</h4>';
    try {
        if (textData.length === 0) {
            dom.aiSectorFingerprintTextRd2.innerHTML = '<p>Not enough data for analysis.</p>';
            return;
        }
        textData.forEach(d => {
            const strengths = [{n: 'S1', v: d.s1Perf}, {n: 'S2', v: d.s2Perf}, {n: 'S3', v: d.s3Perf}].sort((a,b) => b.v - a.v);
            const best = strengths[0];
            const worst = strengths[2];
            html += `<p><strong>Driver #${d.driverNum} (P${d.pos}):</strong> `;
            if (best.v > 99 && worst.v > 99) {
                html += `Was a true "all-rounder," matching the field's best pace in all sectors.`;
            } else {
                html += `Showed strength in <strong>${best.n}</strong> (${best.v.toFixed(1)}% of field best) and weakness in <strong>${worst.n}</strong> (${worst.v.toFixed(1)}%).`;
            }
            html += `</p>`;
        });
    } catch(e) {
         html = `<p class="text-red-600">Error generating fingerprint text: ${e.message}</p>`;
    }
    dom.aiSectorFingerprintTextRd2.innerHTML = html;
}


export function createComparativeAnalyses(analysisDataRd1, analysisDataRd2, lapDataRd1, lapDataRd2, resultsDataRd1, resultsDataRd2) {
    const allTextDivs = [
        dom.compPaceEvolutionText, dom.compConsistencyDeltaText, dom.compPaceQuadrantText,
        dom.compSectorProfileEvolutionText, dom.compRacecraftDeltaText
    ];
    allTextDivs.forEach(div => { if (div) div.innerHTML = '<p>Loading analysis...</p>'; });

    try {
        const commonDrivers = new Set(analysisDataRd1.map(d => d.NUMBER));
        const analysisMapRd1 = new Map(analysisDataRd1.map(d => [d.NUMBER, d]));
        const analysisMapRd2 = new Map(analysisDataRd2.map(d => [d.NUMBER, d]));
        const drivers = Array.from(commonDrivers).filter(num => analysisMapRd2.has(num));
        if (drivers.length === 0) {
            throw new Error("No common drivers found between Raceday 1 and Raceday 2.");
        }
        
        const paceEvolutionData = drivers.map(num => {
            const rd1 = analysisMapRd1.get(num);
            const rd2 = analysisMapRd2.get(num);
            const rd1Avg = (rd1.S1_Avg + rd1.S2_Avg + rd1.S3_Avg);
            const rd2Avg = (rd2.S1_Avg + rd2.S2_Avg + rd2.S3_Avg);
            const delta = (rd1Avg > 0 && rd2Avg > 0) ? (rd2Avg - rd1Avg) : NaN;
            return {
                number: num,
                posRd1: rd1.POS,
                posRd2: rd2.POS,
                rd1Avg,
                rd2Avg,
                delta
            };
        }).filter(d => !isNaN(d.delta)).sort((a, b) => a.delta - b.delta);
        
        compPaceEvolutionInstance = createPaceEvolutionChart(paceEvolutionData);
        generatePaceEvolutionText(paceEvolutionData);

        const getConsistency = (analysis, results) => {
            const bestLapMap = new Map(results.map(d => [d.NUMBER, parseTimeToSeconds(d.BEST_LAP_TIME)]));
            return analysis.map(d => {
                const avg = (d.S1_Avg + d.S2_Avg + d.S3_Avg);
                const best = bestLapMap.get(d.NUMBER) || NaN;
                const gap = (avg > 0 && best > 0) ? (avg - best) : NaN;
                return { number: d.NUMBER, pos: d.POS, gap };
            });
        }
        const consistencyRd1 = new Map(getConsistency(analysisDataRd1, resultsDataRd1).map(d => [d.number, d.gap]));
        const consistencyRd2 = new Map(getConsistency(analysisDataRd2, resultsDataRd2).map(d => [d.number, d.gap]));

        const consistencyDeltaData = drivers.map(num => {
            const gapRd1 = consistencyRd1.get(num);
            const gapRd2 = consistencyRd2.get(num);
            const delta = (gapRd1 > 0 && gapRd2 > 0) ? (gapRd2 - gapRd1) : NaN;
            return {
                number: num,
                posRd2: analysisMapRd2.get(num).POS,
                gapRd1,
                gapRd2,
                delta
            };
        }).filter(d => !isNaN(d.delta)).sort((a, b) => a.delta - b.delta);

        compConsistencyDeltaInstance = createConsistencyDeltaChart(consistencyDeltaData);
        generateConsistencyDeltaText(consistencyDeltaData);

        const bestLapRd1 = new Map(resultsDataRd1.map(d => [d.NUMBER, parseTimeToSeconds(d.BEST_LAP_TIME)]));
        const bestLapRd2 = new Map(resultsDataRd2.map(d => [d.NUMBER, parseTimeToSeconds(d.BEST_LAP_TIME)]));

        const paceQuadrantData = drivers.map(num => {
            const avgRd1 = (analysisMapRd1.get(num).S1_Avg + analysisMapRd1.get(num).S2_Avg + analysisMapRd1.get(num).S3_Avg);
            const avgRd2 = (analysisMapRd2.get(num).S1_Avg + analysisMapRd2.get(num).S2_Avg + analysisMapRd2.get(num).S3_Avg);
            const bestRd1 = bestLapRd1.get(num);
            const bestRd2 = bestLapRd2.get(num);
            
            const avgDelta = (avgRd1 > 0 && avgRd2 > 0) ? (avgRd2 - avgRd1) : NaN;
            const bestDelta = (bestRd1 > 0 && bestRd2 > 0) ? (bestRd2 - bestRd1) : NaN;

            return {
                number: num,
                posRd2: analysisMapRd2.get(num).POS,
                x: bestDelta,
                y: avgDelta,
            };
        }).filter(d => !isNaN(d.x) && !isNaN(d.y));

        compPaceQuadrantInstance = createPaceQuadrantChart(paceQuadrantData);
        generatePaceQuadrantText(paceQuadrantData);

        const commonDriversForProfile = analysisDataRd2.filter(d2 => analysisMapRd1.has(d2.NUMBER));
        populateSectorProfileEvolutionDropdown(commonDriversForProfile);
        dom.compSectorProfileEvolutionText.innerHTML = '<p>Select a driver from the dropdown above to generate a profile.</p>';

        const getRacecraft = (results) => {
            const bestLapData = results.map(d => {
                const bestLapTime_s = parseTimeToSeconds(d.BEST_LAP_TIME);
                const winnerLaps = Math.max(...results.map(r => parseInt(r.LAPS)).filter(l => !isNaN(l) && l > 0));
                return {
                    number: d.NUMBER,
                    actualPos: parseInt(d.POS),
                    theoreticalTime_s: (bestLapTime_s > 0 && winnerLaps > 0) ? bestLapTime_s * winnerLaps : Infinity
                };
            }).filter(d => d.theoreticalTime_s !== Infinity && d.number);
            bestLapData.sort((a, b) => a.theoreticalTime_s - b.theoreticalTime_s);
            bestLapData.forEach((d, i) => d.theoreticalRank = i + 1);
            
            return bestLapData.map(d => ({
                number: d.number,
                score: d.theoreticalRank - d.actualPos
            }));
        }
        const racecraftRd1 = new Map(getRacecraft(resultsDataRd1).map(d => [d.number, d.score]));
        const racecraftRd2 = new Map(getRacecraft(resultsDataRd2).map(d => [d.number, d.score]));

        const racecraftDeltaData = drivers.map(num => {
            const scoreRd1 = racecraftRd1.get(num);
            const scoreRd2 = racecraftRd2.get(num);
            const delta = (!isNaN(scoreRd1) && !isNaN(scoreRd2)) ? (scoreRd2 - scoreRd1) : NaN;
            return {
                number: num,
                posRd2: analysisMapRd2.get(num).POS,
                scoreRd1,
                scoreRd2,
                delta
            };
        }).filter(d => !isNaN(d.delta)).sort((a, b) => b.delta - a.delta);

        compRacecraftDeltaInstance = createRacecraftDeltaChart(racecraftDeltaData);
        generateRacecraftDeltaText(racecraftDeltaData);

        return {
            paceEvolutionData,
            consistencyDeltaData,
            paceQuadrantData,
            racecraftDeltaData
        };
    
    } catch (error) {
        console.error("Failed to create Comparative analysis:", error);
        const errorMsg = `<p class="text-red-600">Error generating comparative analysis: ${error.message}</p>`;
        allTextDivs.forEach(div => { if (div) div.innerHTML = errorMsg; });
        return {};
    }
}


function createPaceEvolutionChart(data) {
    if (compPaceEvolutionInstance) compPaceEvolutionInstance.destroy();
    const chartHeight = Math.max(500, data.length * 25 + 120);
    dom.compPaceEvolutionContainer.style.height = `${chartHeight}px`;

    const labels = data.map(d => `#${d.number} (RD1: P${d.posRd1}, RD2: P${d.posRd2})`);
    const deltas = data.map(d => d.delta);

    compPaceEvolutionInstance = new Chart(dom.compPaceEvolutionCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg. Lap Time Delta (RD2 - RD1)',
                data: deltas,
                backgroundColor: deltas.map(v => (v > 0) ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)'),
                borderColor: deltas.map(v => (v > 0) ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Time Gained (Negative) / Lost (Positive) in Seconds' } }
            },
            plugins: {
                title: { display: true, text: 'Driver Pace Evolution (RD1 vs. RD2)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Change: ${context.raw.toFixed(3)}s`,
                            `RD1 Avg: ${data[context.dataIndex].rd1Avg.toFixed(3)}s`,
                            `RD2 Avg: ${data[context.dataIndex].rd2Avg.toFixed(3)}s`,
                        ]
                    }
                }
            }
        }
    });
}

function generatePaceEvolutionText(data) {
    let html = '<h4>Key Insights</h4>';
    try {
        const improver = data[0];
        const fader = data[data.length - 1];
        
        html += `<p><strong>Biggest Mover:</strong> Driver <strong>#${improver.number}</strong> clearly nailed the setup for Day 2, finding an incredible <strong>${Math.abs(improver.delta).toFixed(3)}s/lap</strong> on average.</p>`;
        html += `<p><strong>Faded Pace:</strong> Driver <strong>#${fader.number}</strong> struggled on Day 2, ending up <strong>${fader.delta.toFixed(3)}s/lap</strong> slower, falling from P${fader.posRd1} to P${fader.posRd2}.</p>`;
        
    } catch (e) { html = `<p class="text-red-600">Error generating insights: ${e.message}</p>`; }
    dom.compPaceEvolutionText.innerHTML = html;
}

function createConsistencyDeltaChart(data) {
    if (compConsistencyDeltaInstance) compConsistencyDeltaInstance.destroy();
    const chartHeight = Math.max(500, data.length * 25 + 120);
    dom.compConsistencyDeltaContainer.style.height = `${chartHeight}px`;
    
    const labels = data.map(d => `#${d.number} (RD2 Pos: P${d.posRd2})`);
    const deltas = data.map(d => d.delta);

    compConsistencyDeltaInstance = new Chart(dom.compConsistencyDeltaCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Consistency Gap Delta (RD2 - RD1)',
                data: deltas,
                backgroundColor: deltas.map(v => (v > 0) ? 'rgba(234, 179, 8, 0.8)' : 'rgba(14, 165, 233, 0.8)'),
                borderColor: deltas.map(v => (v > 0) ? 'rgb(234, 179, 8)' : 'rgb(14, 165, 233)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Change in (Avg - Best) Lap Gap (Seconds)' } }
            },
            plugins: {
                title: { display: true, text: 'Consistency Evolution (Who Cleaned Up Their Act?)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Change: ${context.raw.toFixed(3)}s`,
                            `RD1 Gap: ${data[context.dataIndex].gapRd1.toFixed(3)}s`,
                            `RD2 Gap: ${data[context.dataIndex].gapRd2.toFixed(3)}s`,
                        ]
                    }
                }
            }
        }
    });
}

function generateConsistencyDeltaText(data) {
    let html = '<h4>Key Insights</h4>';
    try {
        const improver = data[0];
        const fader = data[data.length - 1];
        
        html += `<p><strong>Locked In:</strong> Driver <strong>#${improver.number}</strong> became much more reliable, cutting their consistency gap by <strong>${Math.abs(improver.delta).toFixed(3)}s</strong>. They learned to run clean laps.</p>`;
        html += `<p><strong>Erratic Speed:</strong> Driver <strong>#${fader.number}</strong> became less consistent. Their gap grew by <strong>${fader.delta.toFixed(3)}s</strong>, suggesting they were pushing harder and making more mistakes.</p>`;
        
    } catch (e) { html = `<p class="text-red-600">Error generating insights: ${e.message}</p>`; }
    dom.compConsistencyDeltaText.innerHTML = html;
}

function createPaceQuadrantChart(data) {
    if (compPaceQuadrantInstance) compPaceQuadrantInstance.destroy();
    dom.compPaceQuadrantContainer.style.height = `500px`;

    const chartData = data.map(d => ({
        ...d,
        color: colors[d.posRd2 % colors.length] || '#808080'
    }));
    
    compPaceQuadrantInstance = new Chart(dom.compPaceQuadrantCanvas, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Drivers',
                data: chartData,
                backgroundColor: chartData.map(d => d.color),
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { 
                    title: { display: true, text: '← Faster Best Lap | Slower Best Lap →' },
                    grid: { color: (ctx) => ctx.tick.value === 0 ? 'red' : 'rgba(0,0,0,0.1)' }
                },
                y: { 
                    title: { display: true, text: '← Faster Avg. Pace | Slower Avg. Pace →' },
                    grid: { color: (ctx) => ctx.tick.value === 0 ? 'red' : 'rgba(0,0,0,0.1)' }
                }
            },
            plugins: {
                title: { display: true, text: 'Pace Development Quadrant', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Driver: #${context.raw.number} (P${context.raw.posRd2})`,
                            `Best Lap Change: ${context.raw.x.toFixed(3)}s`,
                            `Avg. Pace Change: ${context.raw.y.toFixed(3)}s`
                        ]
                    }
                },
                annotation: {
                    annotations: {
                        label1: { type: 'label', xValue: '50%', yValue: '25%', content: 'Hero or Zero', color: 'rgba(0,0,0,0.3)' },
                        label2: { type: 'label', xValue: '100%', yValue: '25%', content: 'Lost Setup', color: 'rgba(0,0,0,0.3)' },
                        label3: { type: 'label', xValue: '50%', yValue: '75%', content: 'True Improvers', color: 'rgba(0,0,0,0.3)' },
                        label4: { type: 'label', xValue: '100%', yValue: '75%', content: 'Maximized Package', color: 'rgba(0,0,0,0.3)' }
                    }
                }
            }
        }
    });
}

function generatePaceQuadrantText(data) {
    let html = '<h4>Quadrant Analysis</h4>';
    try {
        const trueImprovers = data.filter(d => d.x < 0 && d.y < 0).map(d => `#${d.number}`);
        const maximized = data.filter(d => d.x >= 0 && d.y < 0).map(d => `#${d.number}`);
        const heroOrZero = data.filter(d => d.x < 0 && d.y >= 0).map(d => `#${d.number}`);
        const lostSetup = data.filter(d => d.x >= 0 && d.y >= 0).map(d => `#${d.number}`);

        html += `<p><strong>True Improvers (Bottom-Left):</strong> ${trueImprovers.length > 0 ? trueImprovers.join(', ') : 'None'}. Unlocked new ultimate speed AND improved average race pace.</p>`;
        html += `<p><strong>Maximized Package (Bottom-Right):</strong> ${maximized.length > 0 ? maximized.join(', ') : 'None'}. Didn't get faster, but became more consistent and improved their average.</p>`;
        html += `<p><strong>Hero or Zero (Top-Left):</strong> ${heroOrZero.length > 0 ? heroOrZero.join(', ') : 'None'}. Set a faster 'hero lap' but couldn't sustain it, hurting their average pace.</p>`;
        html += `<p><strong>Lost Setup (Top-Right):</strong> ${lostSetup.length > 0 ? lostSetup.join(', ') : 'None'}. Went backward, ending up slower in both ultimate and average pace.</p>`;
        
    } catch (e) { html = `<p class="text-red-600">Error generating insights: ${e.message}</p>`; }
    dom.compPaceQuadrantText.innerHTML = html;
}

function populateSectorProfileEvolutionDropdown(commonDrivers) {
    const container = dom.compSectorProfileEvolutionSelect;
    container.innerHTML = ''; 
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "-- Select a Common Driver --";
    container.appendChild(defaultOption);

    commonDrivers.sort((a,b) => a.POS - b.POS).forEach((driver) => {
        const option = document.createElement('option');
        option.value = driver.NUMBER;
        option.textContent = `#${driver.NUMBER} (RD2 Pos: P${driver.POS})`;
        container.appendChild(option);
    });
}

export function createSectorProfileEvolutionChart(driversToAnalyze, lapDataRd1, lapDataRd2, analysisDataRd1, analysisDataRd2) {
    if (compSectorProfileEvolutionInstance) compSectorProfileEvolutionInstance.destroy();

    try {
        const selectedDriverNumber = dom.compSectorProfileEvolutionSelect.value;
        if (!selectedDriverNumber) {
            dom.compSectorProfileEvolutionText.innerHTML = '<p>Select a driver to generate a profile.</p>';
            return;
        }

        const getProfile = (lapData, analysis) => {
            let fieldBestS1 = Infinity, fieldBestS2 = Infinity, fieldBestS3 = Infinity;
            const driverSectors = {};
            for (const row of lapData) {
                const flag = row.FLAG_AT_FL;
                const pitTime = parseTimeToSeconds(row.PIT_TIME);
                if (flag !== 'GF' || (pitTime > 0)) continue;

                const s1 = parseFloat(row.S1_SECONDS);
                const s2 = parseFloat(row.S2_SECONDS);
                const s3 = parseFloat(row.S3_SECONDS);
                if (s1 > 0) fieldBestS1 = Math.min(fieldBestS1, s1);
                if (s2 > 0) fieldBestS2 = Math.min(fieldBestS2, s2);
                if (s3 > 0) fieldBestS3 = Math.min(fieldBestS3, s3);
                
                const driverNum = row.NUMBER;
                if (driverNum === selectedDriverNumber) {
                    if (!driverSectors[driverNum]) driverSectors[driverNum] = { s1: [], s2: [], s3: [] };
                    if (s1 > 0) driverSectors[driverNum].s1.push(s1);
                    if (s2 > 0) driverSectors[driverNum].s2.push(s2);
                    if (s3 > 0) driverSectors[driverNum].s3.push(s3);
                }
            }
            
            const sectors = driverSectors[selectedDriverNumber];
            if (!sectors) return { s1Perf: 0, s2Perf: 0, s3Perf: 0 };
            
            const avgS1 = getAvg(sectors.s1);
            const avgS2 = getAvg(sectors.s2);
            const avgS3 = getAvg(sectors.s3);
            const s1Perf = (avgS1 === 0 || fieldBestS1 === 0 || fieldBestS1 === Infinity) ? 0 : (fieldBestS1 / avgS1) * 100;
            const s2Perf = (avgS2 === 0 || fieldBestS2 === 0 || fieldBestS2 === Infinity) ? 0 : (fieldBestS2 / avgS2) * 100;
            const s3Perf = (avgS3 === 0 || fieldBestS3 === 0 || fieldBestS3 === Infinity) ? 0 : (fieldBestS3 / avgS3) * 100;
            
            return { s1Perf, s2Perf, s3Perf };
        };

        const profileRd1 = getProfile(lapDataRd1, analysisDataRd1);
        const profileRd2 = getProfile(lapDataRd2, analysisDataRd2);
        
        const datasets = [
            {
                label: `Raceday 1 (P${analysisDataRd1.find(d=>d.NUMBER===selectedDriverNumber).POS})`,
                data: [profileRd1.s1Perf, profileRd1.s2Perf, profileRd1.s3Perf],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
            },
            {
                label: `Raceday 2 (P${analysisDataRd2.find(d=>d.NUMBER===selectedDriverNumber).POS})`,
                data: [profileRd2.s1Perf, profileRd2.s2Perf, profileRd2.s3Perf],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
            }
        ];
        
        const allValues = [...datasets[0].data, ...datasets[1].data].filter(v => v > 0);
        const minPerf = allValues.length > 0 ? Math.min(...allValues) : 0;
        const newMin = Math.max(0, Math.floor(minPerf) - 5);

        compSectorProfileEvolutionInstance = new Chart(dom.compSectorProfileEvolutionCanvas, {
            type: 'radar',
            data: {
                labels: ['Sector 1', 'Sector 2', 'Sector 3'],
                datasets: datasets
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    r: {
                        min: newMin,
                        max: 100,
                        angleLines: { display: true },
                        ticks: { display: true, backdropColor: 'rgba(255, 255, 255, 0.75)' },
                        pointLabels: { font: { size: 14, weight: 'bold' } }
                    }
                },
                plugins: {
                    title: { display: true, text: `Sector Profile Evolution for #${selectedDriverNumber}`, font: { weight: 'bold', size: 16 } },
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label || ''}: ${context.raw.toFixed(2)}%`
                        }
                    }
                }
            }
        });

        generateSectorProfileEvolutionText(profileRd1, profileRd2);

    } catch (e) {
        console.error("Sector Profile Evolution failed:", e);
        dom.compSectorProfileEvolutionText.innerHTML = `<p class="text-red-600">Error: ${e.message}</p>`;
    }
}

function generateSectorProfileEvolutionText(rd1, rd2) {
    let html = '<h4>Key Insights</h4>';
    try {
        const s1Delta = rd2.s1Perf - rd1.s1Perf;
        const s2Delta = rd2.s2Perf - rd1.s2Perf;
        const s3Delta = rd2.s3Perf - rd1.s3Perf;
        const deltas = [
            { name: 'Sector 1', delta: s1Delta },
            { name: 'Sector 2', delta: s2Delta },
            { name: 'Sector 3', delta: s3Delta }
        ].sort((a,b) => b.delta - a.delta);

        const best = deltas[0];
        const worst = deltas[2];

        html += `<p>This driver's biggest improvement came in <strong>${best.name}</strong>, where their performance vs. the field-best improved by <strong>${best.delta.toFixed(1)}</strong> points.`;
        html += ` Their biggest drop-off was in <strong>${worst.name}</strong>, falling by <strong>${Math.abs(worst.delta).toFixed(1)}</strong> points.</p>`;
        
    } catch (e) { html = `<p class="text-red-600">Error generating insights: ${e.message}</p>`; }
    dom.compSectorProfileEvolutionText.innerHTML = html;
}

function createRacecraftDeltaChart(data) {
    if (compRacecraftDeltaInstance) compRacecraftDeltaInstance.destroy();
    const chartHeight = Math.max(500, data.length * 25 + 120);
    dom.compRacecraftDeltaContainer.style.height = `${chartHeight}px`;

    const labels = data.map(d => `#${d.number} (RD2 Pos: P${d.posRd2})`);
    const deltas = data.map(d => d.delta);

    compRacecraftDeltaInstance = new Chart(dom.compRacecraftDeltaCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Racecraft Delta (RD2 Score - RD1 Score)',
                data: deltas,
                backgroundColor: deltas.map(v => (v > 0) ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
                borderColor: deltas.map(v => (v > 0) ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            scales: {
                y: { reverse: false, ticks: { font: { size: 10 } } },
                x: { title: { display: true, text: 'Change in Overperformance (Positions)' } }
            },
            plugins: {
                title: { display: true, text: 'Racecraft Delta (Over/Underperformance Shift)', font: { weight: 'bold', size: 16 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => [
                            `Change: ${context.raw > 0 ? '+' : ''}${context.raw.toFixed(0)} pos.`,
                            `RD1 Score: ${data[context.dataIndex].scoreRd1.toFixed(0)}`,
                            `RD2 Score: ${data[context.dataIndex].scoreRd2.toFixed(0)}`,
                        ]
                    }
                }
            }
        }
    });
}

function generateRacecraftDeltaText(data) {
    let html = '<h4>Key Insights</h4>';
    try {
        const improver = data[0];
        const fader = data[data.length - 1];
        
        html += `<p><strong>Top Racer:</strong> Driver <strong>#${improver.number}</strong> had the best 'Racecraft Delta', with a <strong>${improver.delta.toFixed(0)}-position</strong> positive swing. They learned to race smarter.</p>`;
        html += `<p><strong>Bad Day:</strong> Driver <strong>#${fader.number}</strong> had a tough RD2, with a <strong>${fader.delta.toFixed(0)}-position</strong> negative swing, suggesting they got stuck in the pack.</p>`;
        
    } catch (e) { html = `<p class="text-red-600">Error generating insights: ${e.message}</p>`; }
    dom.compRacecraftDeltaText.innerHTML = html;
}

