import { elements as dom, initDom } from './dom.js';

import { parseFile, getFileHeaders } from './utils.js';
import { uiShowError, uiShowMappingError, uiClearMappingError, uiShowFileUploadError, uiClearFileUploadError } from './ui.js';

import { navigateTo, handleNavClick, navigateToDashboardView } from './navigation.js';

import {
    populateFlagCheckboxesFromData, 
    getSelectedFlags, 
    analyzeDriverData,
    displayEvaluationResults
} from './evaluation.js';
import {
    handleTrackPresetChange, populateSimulatorCarDropdown,
    controlSimulation, resetSimulation, drawSimulator,
    populateSimulatorRacedaySelect
} from './simulator.js';
import {
    createAiAnalysesRd1, createAiAnalysesRd2, createComparativeAnalyses,
    destroyAiCharts,
    createPaceDegradationAnalysisRd1, createPaceDegradationAnalysisRd2,
    createSectorFingerprintAnalysisRd1, createSectorFingerprintAnalysisRd2,
    createSectorProfileEvolutionChart
} from './aiAnalysis.js';
import {
    initChatContext, handleStartChat, handleSendChat, resetChat
} from './chat.js';

let parsedLapDataRd1 = [];
let parsedResultsDataRd1 = []; 
let unfilteredAnalysisDataRd1 = [];
let filteredAnalysisDataRd1 = [];

let parsedLapDataRd2 = [];
let parsedResultsDataRd2 = []; 
let unfilteredAnalysisDataRd2 = [];
let filteredAnalysisDataRd2 = [];

let globalAnalysisData = { rd1: {}, rd2: {}, comp: {} };

let chartS1Instance = null;
let chartS2Instance = null;
let chartS3Instance = null;

let hasRd2Data = false;

let resultsFileHandleRd1 = null;
let lapDataFileHandleRd1 = null;
let resultsHeadersRd1 = [];
let lapDataHeadersRd1 = [];

let resultsFileHandleRd2 = null;
let lapDataFileHandleRd2 = null;
let resultsHeadersRd2 = [];
let lapDataHeadersRd2 = [];

async function openHeaderMappingModal() {
    dom.errorMessage.classList.add('hidden');
    dom.analyzeButtonHome.disabled = true;
    dom.mappingLoadingSpinner.classList.remove('hidden');
    dom.mappingFormContainer.classList.add('hidden');
    dom.headerMappingModal.classList.remove('hidden');
    dom.mappingGridRd2.classList.add('hidden');
    dom.mappingSectionRd2Title.classList.add('hidden');
    dom.mappingGridLapRd2.classList.add('hidden');
    uiClearMappingError();

    try {
        resultsFileHandleRd1 = dom.resultsFileInput.files[0];
        lapDataFileHandleRd1 = dom.lapDataFileInput.files[0];
        resultsFileHandleRd2 = dom.resultsFileRd2Input.files[0];
        lapDataFileHandleRd2 = dom.lapDataFileRd2Input.files[0];
        
        if (!resultsFileHandleRd1 || !lapDataFileHandleRd1) {
            throw new Error('Raceday 1 file handles were lost. Please try uploading again.');
        }

        [resultsHeadersRd1, lapDataHeadersRd1] = await Promise.all([
            getFileHeaders(resultsFileHandleRd1),
            getFileHeaders(lapDataFileHandleRd1)
        ]);
        
        if (!resultsHeadersRd1.length || !lapDataHeadersRd1.length) {
            throw new Error('Could not read headers from one or both Raceday 1 files. Are they empty?');
        }

        populateMappingDropdowns('rd1', resultsHeadersRd1, lapDataHeadersRd1);

        if (resultsFileHandleRd2 && lapDataFileHandleRd2) {
            hasRd2Data = true;
            [resultsHeadersRd2, lapDataHeadersRd2] = await Promise.all([
                getFileHeaders(resultsFileHandleRd2),
                getFileHeaders(lapDataFileHandleRd2)
            ]);

            if (!resultsHeadersRd2.length || !lapDataHeadersRd2.length) {
                throw new Error('Could not read headers from one or both Raceday 2 files.');
            }
            
            populateMappingDropdowns('rd2', resultsHeadersRd2, lapDataHeadersRd2);
            dom.mappingGridRd2.classList.remove('hidden');
            dom.mappingSectionRd2Title.classList.remove('hidden');
            dom.mappingGridLapRd2.classList.remove('hidden');
        } else {
            hasRd2Data = false;
        }

        dom.mappingFormContainer.classList.remove('hidden');
    
    } catch (error) {
        console.error('Failed to open mapping modal:', error);
        uiShowError(error.message);
        dom.headerMappingModal.classList.add('hidden');
    } finally {
        dom.analyzeButtonHome.disabled = false;
        dom.mappingLoadingSpinner.classList.add('hidden');
    }
}

function populateMappingDropdowns(day, resultsHeaders, lapHeaders) {
    const suffix = day === 'rd2' ? '-RD2' : '';
    const resultsSelects = document.querySelectorAll(`.mapping-select[data-file="results"][data-day="${day}"]`);
    const lapSelects = document.querySelectorAll(`.mapping-select[data-file="lap"][data-day="${day}"]`);

    const createOptions = (headers) => {
        let optionsHtml = '<option value="">-- Select Header --</option>';
        headers.forEach(h => {
            optionsHtml += `<option value="${h}">${h}</option>`;
        });
        return optionsHtml;
    };

    const resultsOptions = createOptions(resultsHeaders);
    const lapOptions = createOptions(lapHeaders);

    resultsSelects.forEach(select => {
        select.innerHTML = resultsOptions;
        const fieldName = select.id.split('-').slice(2).join('').replace('RD2','').toUpperCase();
        const guess = resultsHeaders.find(h => h.toUpperCase().replace(/[\s_]/g, '') === fieldName) ||
                      resultsHeaders.find(h => h.toUpperCase().includes(fieldName));
        if (guess) select.value = guess;
    });

    lapSelects.forEach(select => {
        select.innerHTML = lapOptions;
        let idParts = select.id.split('-').slice(2).map(p => p.toUpperCase().replace('-RD2', '').replace('RD2', '')).filter(Boolean);

        let fieldName = idParts[idParts.length - 1];

        if (idParts.includes('PIT') && idParts.includes('TIME')) fieldName = 'PIT_TIME';
        else if (fieldName === 'LAP' && idParts.includes('NUMBER')) fieldName = 'LAP_NUMBER';
        else if (fieldName === 'S1') fieldName = 'S1_SECONDS';
        else if (fieldName === 'S2') fieldName = 'S2_SECONDS';
        else if (fieldName === 'S3') fieldName = 'S3_SECONDS';
        else if (fieldName === 'FLAG') fieldName = 'FLAG_AT_FL';

        const guess = lapHeaders.find(h => h.toUpperCase().replace(/[\s_]/g, '') === fieldName) ||
                      lapHeaders.find(h => h.toUpperCase().includes(fieldName));
        if (guess) select.value = guess;
    });

    const numberGuessR = resultsHeaders.find(h => h.toUpperCase() === 'NUMBER' || h.toUpperCase() === 'CAR');
    if (numberGuessR) document.getElementById(`map-results-number${suffix}`).value = numberGuessR;
    
    const numberGuessL = lapHeaders.find(h => h.toUpperCase() === 'NUMBER' || h.toUpperCase() === 'CAR');
    if (numberGuessL) document.getElementById(`map-lap-number${suffix}`).value = numberGuessL;
}


async function runAnalysisWithMapping() {
    dom.loadingSpinner.classList.remove('hidden');
    dom.headerMappingModal.classList.add('hidden');
    dom.analyzeButtonHome.classList.add('hidden');
    dom.errorMessage.classList.add('hidden');
    dom.errorMessage.textContent = '';
    
    try {
        const resultsMapRd1 = {
            POS: dom.mapResultsPos.value,
            NUMBER: dom.mapResultsNumber.value,
            ELAPSED: dom.mapResultsElapsed.value,
            LAPS: dom.mapResultsLaps.value,
            BEST_LAP_TIME: dom.mapResultsBestLapTime.value,
            BEST_LAP_KPH: dom.mapResultsBestLapKph.value,
        };
        
        const lapDataMapRd1 = {
            NUMBER: dom.mapLapNumber.value,
            FLAG_AT_FL: dom.mapLapFlag.value,
            S1_SECONDS: dom.mapLapS1.value,
            S2_SECONDS: dom.mapLapS2.value,
            S3_SECONDS: dom.mapLapS3.value,
            PIT_TIME: dom.mapLapPitTime.value,
            LAP_NUMBER: dom.mapLapNumberLap.value,
            LAP_TIME: dom.mapLapTime.value,
        };

        if (Object.values(resultsMapRd1).some(v => !v) || Object.values(lapDataMapRd1).some(v => !v)) {
            uiShowMappingError('All Raceday 1 fields are required. Please map every field.');
            dom.headerMappingModal.classList.remove('hidden');
            throw new Error('Incomplete Raceday 1 header mapping.');
        }

        [parsedResultsDataRd1, parsedLapDataRd1] = await Promise.all([
            parseFile(resultsFileHandleRd1, resultsMapRd1),
            parseFile(lapDataFileHandleRd1, lapDataMapRd1)
        ]);

        if (!parsedResultsDataRd1.length) throw new Error('Raceday 1 results file is empty or failed to parse.');
        if (!parsedLapDataRd1.length) throw new Error('Raceday 1 lap data file is empty or failed to parse.');

        if (hasRd2Data) {
            const resultsMapRd2 = {
                POS: dom.mapResultsPosRd2.value,
                NUMBER: dom.mapResultsNumberRd2.value,
                ELAPSED: dom.mapResultsElapsedRd2.value,
                LAPS: dom.mapResultsLapsRd2.value,
                BEST_LAP_TIME: dom.mapResultsBestLapTimeRd2.value,
                BEST_LAP_KPH: dom.mapResultsBestLapKphRd2.value,
            };
            const lapDataMapRd2 = {
                NUMBER: dom.mapLapNumberRd2.value,
                FLAG_AT_FL: dom.mapLapFlagRd2.value,
                S1_SECONDS: dom.mapLapS1Rd2.value,
                S2_SECONDS: dom.mapLapS2Rd2.value,
                S3_SECONDS: dom.mapLapS3Rd2.value,
                PIT_TIME: dom.mapLapPitTimeRd2.value,
                LAP_NUMBER: dom.mapLapNumberLapRd2.value,
                LAP_TIME: dom.mapLapTimeRd2.value,
            };
            
            if (Object.values(resultsMapRd2).some(v => !v) || Object.values(lapDataMapRd2).some(v => !v)) {
                uiShowMappingError('All Raceday 2 fields are required. Please map every field.');
                dom.headerMappingModal.classList.remove('hidden');
                throw new Error('Incomplete Raceday 2 header mapping.');
            }

            [parsedResultsDataRd2, parsedLapDataRd2] = await Promise.all([
                parseFile(resultsFileHandleRd2, resultsMapRd2),
                parseFile(lapDataFileHandleRd2, lapDataMapRd2)
            ]);

            if (!parsedResultsDataRd2.length) throw new Error('Raceday 2 results file is empty or failed to parse.');
            if (!parsedLapDataRd2.length) throw new Error('Raceday 2 lap data file is empty or failed to parse.');
        }

        populateFlagCheckboxesFromData(parsedLapDataRd1, hasRd2Data ? parsedLapDataRd2 : []);
        populateSimulatorRacedaySelect(hasRd2Data);

        await runAnalysis();

        navigateTo('view-dashboard');
        navigateToDashboardView('view-evaluation'); 

        if (hasRd2Data) {
            [dom.evaluationFilterContainer, dom.aiFilterContainer, dom.simulatorFilterContainer].forEach(container => {
                if(container) container.classList.remove('hidden');
            });
        } else {
            [dom.evaluationFilterContainer, dom.aiFilterContainer, dom.simulatorFilterContainer].forEach(container => {
                if(container) container.classList.add('hidden');
            });
        }


    } catch (error) {
        console.error('Analysis failed:', error);
        if (error.message.includes('header mapping')) {

        } else {
            uiShowError(error.message);
        }
    } finally {
        dom.loadingSpinner.classList.add('hidden');
        dom.analyzeButtonHome.classList.remove('hidden');
    }
}

async function runAnalysis() {
    uiResetAnalysis();
    
    try {
        const selectedFlags = getSelectedFlags();
        const excludePitLaps = dom.excludePitLapsCheckbox.checked;
        
        if (parsedResultsDataRd1.length === 0 || parsedLapDataRd1.length === 0) {
            throw new Error('Data not loaded. Please re-upload files.');
        }

        const { analysis: unfilAnRd1 } = analyzeDriverData(parsedResultsDataRd1, parsedLapDataRd1, ['GF'], true);
        unfilteredAnalysisDataRd1 = unfilAnRd1;
        const { analysis: filAnRd1 } = analyzeDriverData(parsedResultsDataRd1, parsedLapDataRd1, selectedFlags, excludePitLaps);
        filteredAnalysisDataRd1 = filAnRd1;

        const aiDataRd1 = createAiAnalysesRd1(parsedResultsDataRd1, parsedLapDataRd1, unfilteredAnalysisDataRd1);

        globalAnalysisData.rd1 = {
            ...aiDataRd1,
            analysisData: unfilteredAnalysisDataRd1
        };

        if (hasRd2Data) {
            const { analysis: unfilAnRd2 } = analyzeDriverData(parsedResultsDataRd2, parsedLapDataRd2, ['GF'], true);
            unfilteredAnalysisDataRd2 = unfilAnRd2;
            const { analysis: filAnRd2 } = analyzeDriverData(parsedResultsDataRd2, parsedLapDataRd2, selectedFlags, excludePitLaps);
            filteredAnalysisDataRd2 = filAnRd2;

            const aiDataRd2 = createAiAnalysesRd2(parsedResultsDataRd2, parsedLapDataRd2, unfilteredAnalysisDataRd2);
            globalAnalysisData.rd2 = {
                ...aiDataRd2,
                analysisData: unfilteredAnalysisDataRd2
            };

            globalAnalysisData.comp = createComparativeAnalyses(
                unfilteredAnalysisDataRd1, unfilteredAnalysisDataRd2,
                parsedLapDataRd1, parsedLapDataRd2,
                parsedResultsDataRd1, parsedResultsDataRd2
            );
        }

        handleEvaluationFilterChange(); 
        handleSimulatorRacedayChange();
        handleAiFilterChange();

        initChatContext(globalAnalysisData, hasRd2Data);

    } catch (error) {
        console.error('Analysis update failed:', error);
        uiShowError(error.message);
    }
}

function getSelectedRaceday(filterGroup) {
    if (!filterGroup) {
        console.warn("Filter group not found, defaulting to RD1.");
        return 'rd1';
    }
    const selected = filterGroup.querySelector('input[name^="raceday-filter"]:checked');
    return selected ? selected.value : 'rd1';
}

function handleAiFilterChange() {
    const selectedDay = getSelectedRaceday(dom.aiFilterGroup);

    Object.values(dom.aiRacedayViews).forEach(view => view.classList.add('hidden'));

    if (selectedDay === 'rd2' && hasRd2Data) {
        dom.aiRacedayViews.rd2.classList.remove('hidden');
    } else if (selectedDay === 'comp' && hasRd2Data) {
        dom.aiRacedayViews.comp.classList.remove('hidden');
    } else {
        dom.aiRacedayViews.rd1.classList.remove('hidden');
    }
}

function handleEvaluationFilterChange() {
    const selectedDay = getSelectedRaceday(dom.evaluationFilterGroup);

    if (chartS1Instance) chartS1Instance.destroy();
    if (chartS2Instance) chartS2Instance.destroy();
    if (chartS3Instance) chartS3Instance.destroy();
    
    let instances;
    if (selectedDay === 'rd2' && hasRd2Data) {
        instances = displayEvaluationResults(filteredAnalysisDataRd2, getSelectedFlags(), dom.excludePitLapsCheckbox.checked, 'Raceday 2');
    } else {
        instances = displayEvaluationResults(filteredAnalysisDataRd1, getSelectedFlags(), dom.excludePitLapsCheckbox.checked, 'Raceday 1');
    }

    if (instances) {
        chartS1Instance = instances.chartS1Instance;
        chartS2Instance = instances.chartS2Instance;
        chartS3Instance = instances.chartS3Instance;
    }
}

function handleSimulatorRacedayChange() {
    const selectedDay = dom.simulatorRacedaySelect.value; 
    
    if (selectedDay === 'rd2' && hasRd2Data) {
        populateSimulatorCarDropdown(unfilteredAnalysisDataRd2, parsedLapDataRd2);
    } else {
        populateSimulatorCarDropdown(unfilteredAnalysisDataRd1, parsedLapDataRd1);
    }
    resetSimulation();
    drawSimulator();
}


function destroyCharts() {
    if (chartS1Instance) chartS1Instance.destroy();
    if (chartS2Instance) chartS2Instance.destroy();
    if (chartS3Instance) chartS3Instance.destroy();
    chartS1Instance = null;
    chartS2Instance = null;
    chartS3Instance = null;
    destroyAiCharts();
}

function uiReset() {
    dom.loadingSpinner.classList.add('hidden');
    dom.analyzeButtonHome.classList.remove('hidden');
    dom.errorMessage.classList.add('hidden');
    dom.errorMessage.textContent = '';
    dom.resultsFileInput.value = '';
    dom.lapDataFileInput.value = '';
    dom.resultsFileRd2Input.value = '';
    dom.lapDataFileRd2Input.value = '';
    dom.raceday2UploadGroup.classList.add('hidden');
    dom.addRaceday2Checkbox.checked = false;

    parsedLapDataRd1 = [];
    parsedResultsDataRd1 = []; 
    unfilteredAnalysisDataRd1 = [];
    filteredAnalysisDataRd1 = [];
    parsedLapDataRd2 = [];
    parsedResultsDataRd2 = []; 
    unfilteredAnalysisDataRd2 = [];
    filteredAnalysisDataRd2 = [];
    globalAnalysisData = { rd1: {}, rd2: {}, comp: {} };
    hasRd2Data = false;

    resultsFileHandleRd1 = lapDataFileHandleRd1 = resultsHeadersRd1 = lapDataHeadersRd1 = null;
    resultsFileHandleRd2 = lapDataFileHandleRd2 = resultsHeadersRd2 = lapDataHeadersRd2 = null;
    
    dom.flagCheckboxes.innerHTML = '';
    dom.excludePitLapsCheckbox.checked = false;
    
    [dom.evaluationFilterContainer, dom.aiFilterContainer, dom.simulatorFilterContainer].forEach(container => {
        if (container) container.classList.add('hidden');
    });

    resetChat();
    uiResetAnalysis();
}

function uiResetAnalysis() {
    dom.tableDiv.innerHTML = '';
    filteredAnalysisDataRd1 = [];
    filteredAnalysisDataRd2 = [];
    unfilteredAnalysisDataRd1 = [];
    unfilteredAnalysisDataRd2 = [];
    globalAnalysisData = { rd1: {}, rd2: {}, comp: {} };

    const aiDivs = document.querySelectorAll('.ai-text-prose, .ai-table');
    aiDivs.forEach(div => {
        if (div.id.includes('Leaderboard')) div.innerHTML = '';
        else div.innerHTML = '<p>Loading analysis...</p>';
    });

    resetSimulation();
    destroyCharts();
}

function initializeApp() {
    initDom();

    dom.analyzeButtonHome.addEventListener('click', () => {
        uiClearFileUploadError();
        dom.fileUploadModal.classList.remove('hidden');
    });

    dom.addRaceday2Checkbox.addEventListener('change', () => {
        dom.raceday2UploadGroup.classList.toggle('hidden', !dom.addRaceday2Checkbox.checked);
    });

    dom.nextButtonFileUpload.addEventListener('click', () => {
        uiClearFileUploadError();
        const resultsFile = dom.resultsFileInput.files[0];
        const lapDataFile = dom.lapDataFileInput.files[0];

        if (!resultsFile || !lapDataFile) {
            uiShowFileUploadError('Please upload both Raceday 1 files to proceed.');
            return;
        }

        const rd2Results = dom.resultsFileRd2Input.files[0];
        const rd2Laps = dom.lapDataFileRd2Input.files[0];
        
        if (dom.addRaceday2Checkbox.checked) {
            if (!rd2Results || !rd2Laps) {
                uiShowFileUploadError('Please upload *both* Raceday 2 files, or uncheck the "Add Raceday 2" box.');
                return;
            }
        }

        dom.fileUploadModal.classList.add('hidden');
        openHeaderMappingModal();
    });

    dom.cancelFileUploadButton.addEventListener('click', () => {
        dom.fileUploadModal.classList.add('hidden');
    });

    dom.confirmMappingButton.addEventListener('click', runAnalysisWithMapping);

    dom.cancelMappingButton.addEventListener('click', () => {
        dom.headerMappingModal.classList.add('hidden');
    });

    dom.exitButton.addEventListener('click', () => {
        navigateTo('view-home');
        uiReset();
    });
    dom.navLinks.forEach(link => link.addEventListener('click', handleNavClick));

    dom.evaluationFilterGroup.addEventListener('change', runAnalysis);
    dom.aiFilterGroup.addEventListener('change', handleAiFilterChange);

    dom.flagCheckboxes.addEventListener('change', runAnalysis);
    dom.excludePitLapsCheckbox.addEventListener('change', runAnalysis);


    dom.simulatorRacedaySelect.addEventListener('change', handleSimulatorRacedayChange); 
    dom.simControlButton.addEventListener('click', () => {
        const selectedDay = dom.simulatorRacedaySelect.value;
        if (selectedDay === 'rd2' && hasRd2Data) {
            controlSimulation(unfilteredAnalysisDataRd2, parsedLapDataRd2);
        } else {
            controlSimulation(unfilteredAnalysisDataRd1, parsedLapDataRd1);
        }
    });
    dom.simResetButton.addEventListener('click', resetSimulation);
    dom.trackPresetSelect.addEventListener('change', handleTrackPresetChange);

    dom.toggleSelectAllPaceDriversRd1.addEventListener('click', () => {
        const allDriverCheckboxes = document.querySelectorAll('#paceDegradationDriverSelection-RD1 input[type="checkbox"]');
        const allSelected = Array.from(allDriverCheckboxes).every(cb => cb.checked);
        allDriverCheckboxes.forEach(checkbox => { checkbox.checked = !allSelected; });
        dom.toggleSelectAllPaceDriversRd1.textContent = allSelected ? 'Select All' : 'Deselect All';
    });
    dom.updatePaceDegradationChartRd1.addEventListener('click', () => {
        createPaceDegradationAnalysisRd1(parsedResultsDataRd1, parsedLapDataRd1, unfilteredAnalysisDataRd1);
    });
    dom.sectorFingerprintDriverSelectRd1.addEventListener('change', () => {
        createSectorFingerprintAnalysisRd1(parsedLapDataRd1, unfilteredAnalysisDataRd1);
    });

    dom.toggleSelectAllPaceDriversRd2.addEventListener('click', () => {
        const allDriverCheckboxes = document.querySelectorAll('#paceDegradationDriverSelection-RD2 input[type="checkbox"]');
        const allSelected = Array.from(allDriverCheckboxes).every(cb => cb.checked);
        allDriverCheckboxes.forEach(checkbox => { checkbox.checked = !allSelected; });
        dom.toggleSelectAllPaceDriversRd2.textContent = allSelected ? 'Select All' : 'Deselect All';
    });
    dom.updatePaceDegradationChartRd2.addEventListener('click', () => {
        createPaceDegradationAnalysisRd2(parsedResultsDataRd2, parsedLapDataRd2, unfilteredAnalysisDataRd2);
    });
    dom.sectorFingerprintDriverSelectRd2.addEventListener('change', () => {
        createSectorFingerprintAnalysisRd2(parsedLapDataRd2, unfilteredAnalysisDataRd2);
    });

    dom.compSectorProfileEvolutionSelect.addEventListener('change', () => {
        if (hasRd2Data) {
            createSectorProfileEvolutionChart(
                unfilteredAnalysisDataRd2.filter(d2 => unfilteredAnalysisDataRd1.some(d1 => d1.NUMBER === d2.NUMBER)),
                parsedLapDataRd1, parsedLapDataRd2,
                unfilteredAnalysisDataRd1, unfilteredAnalysisDataRd2
            );
        }
    });


    dom.startChatButton.addEventListener('click', handleStartChat);
    dom.sendChatButton.addEventListener('click', handleSendChat);
    dom.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendChat();
        }
    });

    handleTrackPresetChange();
    drawSimulator();
    handleEvaluationFilterChange();
    handleAiFilterChange();
    handleSimulatorRacedayChange();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}