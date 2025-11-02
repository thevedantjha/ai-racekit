import { elements as dom } from './dom.js';
import { formatTime, parseTimeToSeconds, colors } from './utils.js';

export function initSimulatorControls() {
    dom.simSpeedSlider.addEventListener('input', () => {
        const speed = parseFloat(dom.simSpeedSlider.value);
        simulationState.speedMultiplier = speed;
        dom.simSpeedLabel.textContent = `${speed.toFixed(1)}x`;
    });
}

const trackPresets = {
    "custom": { name: "-- Custom --", s1: 2000, s2: 1500, s3: 1800 },
    "vir": { name: "Virginia International Raceway", s1: 1652.6, s2: 2158.0, s3: 1452 },
    "sonoma": { name: "Sonoma Raceway", s1: 1385, s2: 1422, s3: 1225 },
    "sebring": { name: "Sebring International Raceway", s1: 1824.2, s2: 1863.7, s3: 2331.0 },
    "road_america": { name: "Road America", s1: 2058.6, s2: 2208, s3: 2193 },
    "ims": { name: "Indianapolis Motor Speedway", s1: 1364.3, s2: 1386.9, s3: 1174 },
    "cota": { name: "Circuit of the Americas", s1: 1308.8, s2: 2240, s3: 1949.5 },
    "barber": { name: "Barber Motorsports Park", s1: 1029, s2: 1580.4, s3: 1065.3 }
};

let simulationState = {
    state: 'stopped',
    animationFrameId: null,
    cars: [],
    track: { s1: 0, s2: 0, s3: 0, total: 1, radius: 220, centerX: 250, centerY: 250, maxOfficialRaceTime: null }, 
    lastTimestamp: 0,
    speedMultiplier: 1.0,
    elapsedTime: 0.0,
    elapsedTimeAtPause: 0.0,
    realWorldStartTime: 0.0,
};

export function populateSimulatorRacedaySelect(hasRd2Data) {
    dom.simulatorRacedaySelect.innerHTML = '';
    
    const rd1Option = document.createElement('option');
    rd1Option.value = 'rd1';
    rd1Option.textContent = 'Raceday 1 Data';
    dom.simulatorRacedaySelect.appendChild(rd1Option);

    if (hasRd2Data) {
        const rd2Option = document.createElement('option');
        rd2Option.value = 'rd2';
        rd2Option.textContent = 'Raceday 2 Data';
        dom.simulatorRacedaySelect.appendChild(rd2Option);
    }
}

export function handleTrackPresetChange() {
    const selectedValue = dom.trackPresetSelect.value;
    const preset = trackPresets[selectedValue];

    if (selectedValue === 'custom') {
        dom.customTrackInputs.classList.remove('hidden');
    } else {
        dom.customTrackInputs.classList.add('hidden');
        dom.s1LengthInput.value = preset.s1;
        dom.s2LengthInput.value = preset.s2;
        dom.s3LengthInput.value = preset.s3;
    }
}

export function populateSimulatorCarDropdown(analysis, parsedLapData) {
    dom.simulatorCarSelect.innerHTML = '';
    
    if (!analysis || analysis.length === 0) {
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "-- No Data --";
        defaultOption.disabled = true;
        dom.simulatorCarSelect.appendChild(defaultOption);
        return;
    }

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "-- Select a Driver --";
    dom.simulatorCarSelect.appendChild(defaultOption);
    
    const simDrivers = {};
    analysis.forEach(driver => {
        simDrivers[driver.NUMBER] = {
            pos: driver.POS,
            hasValidLaps: false,
            color: colors[driver.POS % colors.length] 
        };
    });
    
    for (const row of parsedLapData) {
        const driverNum = row.NUMBER;
        if (simDrivers[driverNum]) {
            const s1 = parseFloat(row.S1_SECONDS);
            const s2 = parseFloat(row.S2_SECONDS);
            const s3 = parseFloat(row.S3_SECONDS);
            const lapTime = parseTimeToSeconds(row.LAP_TIME); 
            const s1_valid = !isNaN(s1) && s1 > 0;
            const s2_valid = !isNaN(s2) && s2 > 0;
            const s3_valid = !isNaN(s3) && s3 > 0;
            const lapTime_valid = !isNaN(lapTime) && lapTime > 0;
            if ((s1_valid && s2_valid && s3_valid) || lapTime_valid) { 
                simDrivers[driverNum].hasValidLaps = true;
            }
        }
    }

    Object.entries(simDrivers).sort(([,a], [,b]) => a.pos - b.pos).forEach(([number, data]) => { 
        const option = document.createElement('option');
        option.value = number;
        option.textContent = `#${number} (P${data.pos})`;
        option.dataset.color = data.color;
        
        if (!data.hasValidLaps) {
            option.disabled = true; 
            option.textContent += " (No valid laps)";
        }
        dom.simulatorCarSelect.appendChild(option);
    });
}

let _analysisData = [];
let _parsedLapData = [];

export function controlSimulation(analysisData, parsedLapData) {
    _analysisData = analysisData;
    _parsedLapData = parsedLapData;

    const state = simulationState.state;
    if (state === 'stopped') {
        startSimulation();
    } else if (state === 'running') {
        pauseSimulation();
    } else if (state === 'paused') {
        resumeSimulation();
    }
}

export function resetSimulation() {
    if (simulationState.animationFrameId) {
        cancelAnimationFrame(simulationState.animationFrameId);
    }
    simulationState.state = 'stopped';
    simulationState.animationFrameId = null;
    simulationState.cars = [];
    simulationState.elapsedTime = 0;
    simulationState.elapsedTimeAtPause = 0; 
    simulationState.realWorldStartTime = 0; 
    
    dom.simControlButton.textContent = 'Start';
    dom.simControlButton.disabled = false;
    dom.simControlButton.style.backgroundColor = '';
    dom.simControlButton.classList.remove('paused', 'running');
    
    dom.simSpeedSlider.value = "1";
    dom.simSpeedLabel.textContent = "1.0x";
    simulationState.speedMultiplier = 1.0;
    dom.simSpeedSlider.disabled = false;

    updateTimerDisplay();
    drawSimulator();
}

export function drawSimulator() {
    const { centerX, centerY, radius, s1, s2, s3 } = simulationState.track;
    const startAngle = -Math.PI / 2;

    dom.simCtx.clearRect(0, 0, dom.simCanvas.width, dom.simCanvas.height);
    dom.simCtx.lineWidth = 10;
    dom.simCtx.lineCap = 'butt';

    dom.simCtx.beginPath();
    dom.simCtx.strokeStyle = '#34D399';
    dom.simCtx.arc(centerX, centerY, radius, startAngle, startAngle + s1);
    dom.simCtx.stroke();

    dom.simCtx.beginPath();
    dom.simCtx.strokeStyle = '#FBBF24';
    dom.simCtx.arc(centerX, centerY, radius, startAngle + s1, startAngle + s1 + s2);
    dom.simCtx.stroke();

    dom.simCtx.beginPath();
    dom.simCtx.strokeStyle = '#F87171';
    dom.simCtx.arc(centerX, centerY, radius, startAngle + s1 + s2, startAngle + s1 + s2 + s3);
    dom.simCtx.stroke();

    dom.simCtx.beginPath();
    dom.simCtx.lineWidth = 2;
    dom.simCtx.strokeStyle = '#000000ff';
    dom.simCtx.moveTo(centerX, centerY - radius - 10);
    dom.simCtx.lineTo(centerX, centerY - radius + 10);
    dom.simCtx.stroke();

    simulationState.cars.forEach(car => {
        const angle = car.progress + startAngle;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        car.x = x;
        car.y = y;
        const carRadius = 7;
        
        dom.simCtx.beginPath();
        dom.simCtx.fillStyle = car.color;
        dom.simCtx.arc(x, y, carRadius, 0, 2 * Math.PI);
        dom.simCtx.fill();
        dom.simCtx.strokeStyle = 'black';
        dom.simCtx.lineWidth = 1;
        dom.simCtx.stroke();
        
        dom.simCtx.fillStyle = 'black';
        dom.simCtx.font = 'bold 10px sans-serif';
        dom.simCtx.textAlign = 'center';
        dom.simCtx.textBaseline = 'middle';
        dom.simCtx.fillText(car.number, x, y);
    });
}

function startSimulation() {
    dom.simError.classList.add('hidden');
    
    try {
        const s1Len = parseFloat(dom.s1LengthInput.value);
        const s2Len = parseFloat(dom.s2LengthInput.value);
        const s3Len = parseFloat(dom.s3LengthInput.value);
        if (isNaN(s1Len) || isNaN(s2Len) || isNaN(s3Len) || s1Len <= 0 || s2Len <= 0 || s3Len <= 0) {
            throw new Error('Please enter valid, positive numbers for all sector lengths.');
        }
        
        const totalLen = s1Len + s2Len + s3Len;
        simulationState.track.s1 = (s1Len / totalLen) * 2 * Math.PI;
        simulationState.track.s2 = (s2Len / totalLen) * 2 * Math.PI;
        simulationState.track.s3 = (s3Len / totalLen) * 2 * Math.PI;
        simulationState.track.total = 2 * Math.PI;

        const selectedDriverNum = dom.simulatorCarSelect.value;
        if (!selectedDriverNum) {
            throw new Error('Please select a driver to simulate.');
        }
        const selectedOption = dom.simulatorCarSelect.selectedOptions[0];
        const selectedDriverColor = selectedOption.dataset.color;

        const driverNum = selectedDriverNum;
        const driverAnalysisData = _analysisData.find(d => d.NUMBER === driverNum);
        const driverLaps = [];

        for (const row of _parsedLapData) {
            if (row.NUMBER === driverNum) {
                const s1 = parseFloat(row.S1_SECONDS);
                const s2 = parseFloat(row.S2_SECONDS);
                const s3 = parseFloat(row.S3_SECONDS);
                const lapTime = parseTimeToSeconds(row.LAP_TIME);
                const lapNum = row.LAP_NUMBER; 
                const s1_valid = !isNaN(s1) && s1 > 0;
                const s2_valid = !isNaN(s2) && s2 > 0;
                const s3_valid = !isNaN(s3) && s3 > 0;
                const lapTime_valid = !isNaN(lapTime) && lapTime > 0;
                if (s1_valid && s2_valid && s3_valid) {
                    driverLaps.push({ s1, s2, s3, lapNum });
                } else if (lapTime_valid) {
                    driverLaps.push({ totalLapSeconds: lapTime, lapNum });
                }
            }
        }

        if (driverLaps.length === 0) {
            throw new Error(`Driver #${driverNum} has no valid lap data.`);
        }
        
        simulationState.cars = [{
            number: driverNum,
            color: selectedDriverColor,
            laps: driverLaps,
            currentLapIndex: 0,
            currentSector: 1,
            progress: 0,
            lapCount: 0,
            position: 1,
            x: 0, y: 0,
            currentSpeedRad: 0,
            finished: false,
            lapText: '',
            finishTime: Infinity,
            officialFinishTime: driverAnalysisData?.Official_Elapsed_Time_s || Infinity
        }];
    
        simulationState.cars.forEach(updateCarSpeed);

        simulationState.state = 'running';
        dom.simControlButton.textContent = 'Pause';
        dom.simControlButton.style.backgroundColor = 'var(--color-s2)';
        dom.simSpeedSlider.disabled = true;

        simulationState.elapsedTimeAtPause = 0;
        simulationState.realWorldStartTime = performance.now();
        simulationState.lastTimestamp = performance.now();
        simulationState.animationFrameId = requestAnimationFrame(animationLoop);

    } catch (error) {
        dom.simError.textContent = error.message;
        dom.simError.classList.remove('hidden');
    }
}

function updateCarSpeed(car) {
    if (car.finished) {
        car.currentSpeedRad = 0;
        return;
    }

    const { total: totalAngle } = simulationState.track;
    const totalLen = parseFloat(dom.s1LengthInput.value) + parseFloat(dom.s2LengthInput.value) + parseFloat(dom.s3LengthInput.value);
    const radsPerMeter = totalAngle / totalLen;
    
    const lap = car.laps[car.currentLapIndex];
    if (!lap) { 
        console.error(`Car #${car.number} missing lap data for index ${car.currentLapIndex}`);
        car.currentSpeedRad = 0;
        return;
    }
    
    if (lap.totalLapSeconds) {
        const speed_mps = totalLen / lap.totalLapSeconds;
        car.currentSpeedRad = speed_mps * radsPerMeter;
    } else {
        let time, len_meters;
        if (car.currentSector === 1) {
            time = lap.s1;
            len_meters = parseFloat(dom.s1LengthInput.value);
        } else if (car.currentSector === 2) {
            time = lap.s2;
            len_meters = parseFloat(dom.s2LengthInput.value);
        } else {
            time = lap.s3;
            len_meters = parseFloat(dom.s3LengthInput.value);
        }
        
        if (time <= 0 || isNaN(time)) {
            console.warn(`Driver #${car.number} has invalid sector time (${time}). Pausing car.`);
            car.currentSpeedRad = 0;
        } else {
            const speed_mps = len_meters / time;
            car.currentSpeedRad = speed_mps * radsPerMeter;
        }
    }
}

function pauseSimulation() {
    simulationState.state = 'paused';
    cancelAnimationFrame(simulationState.animationFrameId);
    simulationState.animationFrameId = null;
    simulationState.elapsedTimeAtPause = simulationState.elapsedTime;
    dom.simControlButton.textContent = 'Resume';
    dom.simControlButton.style.backgroundColor = 'var(--color-green)';
    dom.simSpeedSlider.disabled = false;
}

function resumeSimulation() {
    simulationState.state = 'running';
    dom.simControlButton.textContent = 'Pause';
    dom.simControlButton.style.backgroundColor = 'var(--color-s2)';
    dom.simSpeedSlider.disabled = true;
    simulationState.realWorldStartTime = performance.now();
    simulationState.lastTimestamp = performance.now();
    simulationState.animationFrameId = requestAnimationFrame(animationLoop);
}

function animationLoop(timestamp) {
    simulationState.lastTimestamp = timestamp;
    let allCarsFinished = false;

    if (simulationState.state === 'running') {
        const realTimePassedSinceResume = (timestamp - simulationState.realWorldStartTime) / 1000;
        const newElapsedTime = simulationState.elapsedTimeAtPause + (realTimePassedSinceResume * simulationState.speedMultiplier);
        const logicalDeltaTime = newElapsedTime - simulationState.elapsedTime;
        simulationState.elapsedTime = newElapsedTime;
        
        const { s1: s1_end, s2, total } = simulationState.track;
        const s2_end = s1_end + s2;
        const timeScaledDelta = logicalDeltaTime;

        simulationState.cars.forEach(car => {
            if (car.finished || car.currentSpeedRad === 0) return;
            const lap = car.laps[car.currentLapIndex];
            if (!lap) return;

            const newProgress = car.progress + (car.currentSpeedRad * timeScaledDelta);
            const wrappedProgress = newProgress % total;
            let newSector = 1;
            if (wrappedProgress >= s1_end) newSector = 2;
            if (wrappedProgress >= s2_end) newSector = 3;

            if (newProgress >= total) {
                car.lapCount++;
                if (car.currentSector === 3 && newSector === 1) {
                    car.currentSector = 1;
                    if (car.currentLapIndex + 1 >= car.laps.length) {
                        car.finished = true;
                        car.currentSpeedRad = 0;
                        car.progress = 0;
                        car.finishTime = (car.officialFinishTime !== Infinity) ? car.officialFinishTime : simulationState.elapsedTime; 
                    } else {
                        car.currentLapIndex++;
                        updateCarSpeed(car);
                    }
                }
            } 
            else if (car.currentSector !== newSector) {
                car.currentSector = newSector;
                if (!lap.totalLapSeconds) {
                    updateCarSpeed(car);
                }
            }
            
            if (!car.finished) {
                car.progress = wrappedProgress;
            }
        });

        allCarsFinished = simulationState.cars.every(car => car.finished);
        
        if (allCarsFinished && simulationState.cars.length > 0) {
            pauseSimulation();
            dom.simControlButton.textContent = 'Finished';
            dom.simControlButton.disabled = true;
            dom.simControlButton.style.backgroundColor = 'var(--color-gray)';
        }
    }
    
    simulationState.cars.forEach((car, index) => {
        car.position = index + 1;
        const currentLapData = car.laps[car.currentLapIndex];
        if (car.finished) {
            car.lapText = `Finished`;
        } else if (currentLapData) {
            const lapNum = currentLapData.lapNum ? currentLapData.lapNum : 'N/A';
            const lapType = currentLapData.totalLapSeconds ? ' (Total)' : '';
            car.lapText = lapNum !== 'N/A' ? `${lapNum}${lapType}` : `(Sim ${car.lapCount + 1})`;
        } else {
            car.lapText = `(Sim ${car.lapCount + 1})`; 
        }
    });

    updateTimerDisplay();
    drawSimulator();
    
    if (simulationState.state !== 'stopped' && !allCarsFinished) {
        simulationState.animationFrameId = requestAnimationFrame(animationLoop);
    }
}

function updateTimerDisplay() {
    const allCarsFinished = simulationState.cars.length > 0 && simulationState.cars.every(car => car.finished);
    if (simulationState.state === 'paused' && allCarsFinished) {
        dom.simTimerDisplay.textContent = 'FINISHED';
    } else {
        dom.simTimerDisplay.textContent = formatTime(simulationState.elapsedTime);
    }
}

