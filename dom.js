export const elements = {};

export function initDom() {
    elements.resultsFileInput = document.getElementById('resultsFile');
    elements.lapDataFileInput = document.getElementById('lapDataFile');
    elements.errorMessage = document.getElementById('errorMessage');
    elements.loadingSpinner = document.getElementById('loadingSpinner');
    elements.summaryText = document.getElementById('summaryText');
    elements.chartS1Canvas = document.getElementById('chartS1');
    elements.chartS2Canvas = document.getElementById('chartS2');
    elements.chartS3Canvas = document.getElementById('chartS3');
    elements.chartContainerS1 = document.getElementById('chartContainerS1');
    elements.chartContainerS2 = document.getElementById('chartContainerS2');
    elements.chartContainerS3 = document.getElementById('chartContainerS3');
    elements.tableDiv = document.getElementById('tableDiv');
    elements.flagCheckboxes = document.getElementById('flagCheckboxes');
    elements.chartSubtitle = document.getElementById('chartSubtitle');
    elements.excludePitLapsCheckbox = document.getElementById('excludePitLaps');

    elements.fileUploadModal = document.getElementById('fileUploadModal');
    elements.fileUploadErrorMessage = document.getElementById('fileUploadErrorMessage');
    elements.nextButtonFileUpload = document.getElementById('nextButtonFileUpload');
    elements.cancelFileUploadButton = document.getElementById('cancelFileUploadButton');
    elements.addRaceday2Checkbox = document.getElementById('addRaceday2Checkbox'); 
    elements.raceday2UploadGroup = document.getElementById('raceday2Uploads'); 
    elements.resultsFileRd2Input = document.getElementById('resultsFileRd2');
    elements.lapDataFileRd2Input = document.getElementById('lapDataFileRd2');

    elements.headerMappingModal = document.getElementById('headerMappingModal');
    elements.mappingLoadingSpinner = document.getElementById('mappingLoadingSpinner');
    elements.mappingFormContainer = document.getElementById('mappingFormContainer');
    elements.mappingErrorMessage = document.getElementById('mappingErrorMessage');
    elements.cancelMappingButton = document.getElementById('cancelMappingButton');
    elements.confirmMappingButton = document.getElementById('confirmMappingButton');
    elements.mappingGridRd2 = document.getElementById('mapping-grid-RD2');
    elements.mappingSectionRd2Title = document.getElementById('mapping-section-title-RD2');
    elements.mappingGridLapRd2 = document.getElementById('mapping-grid-lap-RD2');
    
    elements.mapResultsPos = document.getElementById('map-results-pos');
    elements.mapResultsNumber = document.getElementById('map-results-number');
    elements.mapResultsElapsed = document.getElementById('map-results-elapsed');
    elements.mapResultsLaps = document.getElementById('map-results-laps');
    elements.mapResultsBestLapTime = document.getElementById('map-results-best-lap-time');
    elements.mapResultsBestLapKph = document.getElementById('map-results-best-lap-kph');
    elements.mapLapNumber = document.getElementById('map-lap-number');
    elements.mapLapFlag = document.getElementById('map-lap-flag');
    elements.mapLapS1 = document.getElementById('map-lap-s1');
    elements.mapLapS2 = document.getElementById('map-lap-s2');
    elements.mapLapS3 = document.getElementById('map-lap-s3');
    elements.mapLapPitTime = document.getElementById('map-lap-pit-time');
    elements.mapLapNumberLap = document.getElementById('map-lap-number-lap');
    elements.mapLapTime = document.getElementById('map-lap-time');
    elements.mapResultsPosRd2 = document.getElementById('map-results-pos-RD2');
    elements.mapResultsNumberRd2 = document.getElementById('map-results-number-RD2');
    elements.mapResultsElapsedRd2 = document.getElementById('map-results-elapsed-RD2');
    elements.mapResultsLapsRd2 = document.getElementById('map-results-laps-RD2');
    elements.mapResultsBestLapTimeRd2 = document.getElementById('map-results-best-lap-time-RD2');
    elements.mapResultsBestLapKphRd2 = document.getElementById('map-results-best-lap-kph-RD2');
    elements.mapLapNumberRd2 = document.getElementById('map-lap-number-RD2');
    elements.mapLapFlagRd2 = document.getElementById('map-lap-flag-RD2');
    elements.mapLapS1Rd2 = document.getElementById('map-lap-s1-RD2');
    elements.mapLapS2Rd2 = document.getElementById('map-lap-s2-RD2');
    elements.mapLapS3Rd2 = document.getElementById('map-lap-s3-RD2');
    elements.mapLapPitTimeRd2 = document.getElementById('map-lap-pit-time-RD2');
    elements.mapLapNumberLapRd2 = document.getElementById('map-lap-number-lap-RD2');
    elements.mapLapTimeRd2 = document.getElementById('map-lap-time-RD2');

    elements.s1LengthInput = document.getElementById('s1Length');
    elements.s2LengthInput = document.getElementById('s2Length');
    elements.s3LengthInput = document.getElementById('s3Length');
    elements.simulatorCarSelect = document.getElementById('simulatorCarSelect');
    elements.simError = document.getElementById('simulatorErrorMessage');
    elements.simControlButton = document.getElementById('simControlButton');
    elements.simResetButton = document.getElementById('simResetButton');
    elements.simCanvas = document.getElementById('trackSimulatorCanvas');
    elements.simCtx = elements.simCanvas.getContext('2d');
    elements.simSpeedSlider = document.getElementById('simSpeedSlider');
    elements.simSpeedLabel = document.getElementById('simSpeedLabel');
    elements.simTimerDisplay = document.getElementById('simTimerDisplay').querySelector('.timer-text');
    elements.trackPresetSelect = document.getElementById('trackPresetSelect');
    elements.customTrackInputs = document.getElementById('customTrackInputs');
    elements.simulatorRacedaySelect = document.getElementById('simulatorRacedaySelect');

    elements.chartBestLapRaceCanvasRd1 = document.getElementById('chartBestLapRace-RD1');
    elements.chartBestLapRaceContainerRd1 = document.getElementById('chartBestLapRaceContainer-RD1');
    elements.bestLapLeaderboardDivRd1 = document.getElementById('bestLapLeaderboard-RD1');
    elements.aiBestLapTextDivRd1 = document.getElementById('aiBestLapText-RD1');
    elements.chartConsistencyCanvasRd1 = document.getElementById('chartConsistency-RD1');
    elements.chartConsistencyContainerRd1 = document.getElementById('chartConsistencyContainer-RD1');
    elements.aiConsistencyTextDivRd1 = document.getElementById('aiConsistencyText-RD1');
    elements.chartPitStopCanvasRd1 = document.getElementById('chartPitStop-RD1');
    elements.chartPitStopContainerRd1 = document.getElementById('chartPitStopContainer-RD1');
    elements.aiPitStopTextDivRd1 = document.getElementById('aiPitStopText-RD1');
    elements.chartPaceVsPosCanvasRd1 = document.getElementById('chartPaceVsPos-RD1');
    elements.chartPaceVsPosContainerRd1 = document.getElementById('chartPaceVsPosContainer-RD1');
    elements.aiPaceVsPosTextRd1 = document.getElementById('aiPaceVsPosText-RD1');
    elements.chartPaceDegradationCanvasRd1 = document.getElementById('chartPaceDegradation-RD1');
    elements.chartPaceDegradationContainerRd1 = document.getElementById('chartPaceDegradationContainer-RD1');
    elements.aiPaceDegradationTextRd1 = document.getElementById('aiPaceDegradationText-RD1');
    elements.chartCostlyMistakeCanvasRd1 = document.getElementById('chartCostlyMistake-RD1');
    elements.chartCostlyMistakeContainerRd1 = document.getElementById('chartCostlyMistakeContainer-RD1');
    elements.aiCostlyMistakeTextRd1 = document.getElementById('aiCostlyMistakeText-RD1');
    elements.chartSectorFingerprintCanvasRd1 = document.getElementById('chartSectorFingerprint-RD1');
    elements.chartSectorFingerprintContainerRd1 = document.getElementById('chartSectorFingerprintContainer-RD1');
    elements.aiSectorFingerprintTextRd1 = document.getElementById('aiSectorFingerprintText-RD1');
    elements.paceDegradationDriverSelectionRd1 = document.getElementById('paceDegradationDriverSelection-RD1');
    elements.toggleSelectAllPaceDriversRd1 = document.getElementById('toggleSelectAllPaceDrivers-RD1');
    elements.updatePaceDegradationChartRd1 = document.getElementById('updatePaceDegradationChart-RD1');
    elements.sectorFingerprintDriverSelectRd1 = document.getElementById('sectorFingerprintDriverSelect-RD1');

    elements.chartBestLapRaceCanvasRd2 = document.getElementById('chartBestLapRace-RD2');
    elements.chartBestLapRaceContainerRd2 = document.getElementById('chartBestLapRaceContainer-RD2');
    elements.bestLapLeaderboardDivRd2 = document.getElementById('bestLapLeaderboard-RD2');
    elements.aiBestLapTextDivRd2 = document.getElementById('aiBestLapText-RD2');
    elements.chartConsistencyCanvasRd2 = document.getElementById('chartConsistency-RD2');
    elements.chartConsistencyContainerRd2 = document.getElementById('chartConsistencyContainer-RD2');
    elements.aiConsistencyTextDivRd2 = document.getElementById('aiConsistencyText-RD2');
    elements.chartPitStopCanvasRd2 = document.getElementById('chartPitStop-RD2');
    elements.chartPitStopContainerRd2 = document.getElementById('chartPitStopContainer-RD2');
    elements.aiPitStopTextDivRd2 = document.getElementById('aiPitStopText-RD2');
    elements.chartPaceVsPosCanvasRd2 = document.getElementById('chartPaceVsPos-RD2');
    elements.chartPaceVsPosContainerRd2 = document.getElementById('chartPaceVsPosContainer-RD2');
    elements.aiPaceVsPosTextRd2 = document.getElementById('aiPaceVsPosText-RD2');
    elements.chartPaceDegradationCanvasRd2 = document.getElementById('chartPaceDegradation-RD2');
    elements.chartPaceDegradationContainerRd2 = document.getElementById('chartPaceDegradationContainer-RD2');
    elements.aiPaceDegradationTextRd2 = document.getElementById('aiPaceDegradationText-RD2');
    elements.chartCostlyMistakeCanvasRd2 = document.getElementById('chartCostlyMistake-RD2');
    elements.chartCostlyMistakeContainerRd2 = document.getElementById('chartCostlyMistakeContainer-RD2');
    elements.aiCostlyMistakeTextRd2 = document.getElementById('aiCostlyMistakeText-RD2');
    elements.chartSectorFingerprintCanvasRd2 = document.getElementById('chartSectorFingerprint-RD2');
    elements.chartSectorFingerprintContainerRd2 = document.getElementById('chartSectorFingerprintContainer-RD2');
    elements.aiSectorFingerprintTextRd2 = document.getElementById('aiSectorFingerprintText-RD2');
    elements.paceDegradationDriverSelectionRd2 = document.getElementById('paceDegradationDriverSelection-RD2');
    elements.toggleSelectAllPaceDriversRd2 = document.getElementById('toggleSelectAllPaceDrivers-RD2');
    elements.updatePaceDegradationChartRd2 = document.getElementById('updatePaceDegradationChart-RD2');
    elements.sectorFingerprintDriverSelectRd2 = document.getElementById('sectorFingerprintDriverSelect-RD2');

    elements.compPaceEvolutionCanvas = document.getElementById('compPaceEvolutionCanvas');
    elements.compPaceEvolutionContainer = document.getElementById('compPaceEvolutionContainer');
    elements.compPaceEvolutionText = document.getElementById('compPaceEvolutionText');
    elements.compConsistencyDeltaCanvas = document.getElementById('compConsistencyDeltaCanvas');
    elements.compConsistencyDeltaContainer = document.getElementById('compConsistencyDeltaContainer');
    elements.compConsistencyDeltaText = document.getElementById('compConsistencyDeltaText');
    elements.compPaceQuadrantCanvas = document.getElementById('compPaceQuadrantCanvas');
    elements.compPaceQuadrantContainer = document.getElementById('compPaceQuadrantContainer');
    elements.compPaceQuadrantText = document.getElementById('compPaceQuadrantText');
    elements.compSectorProfileEvolutionCanvas = document.getElementById('compSectorProfileEvolutionCanvas');
    elements.compSectorProfileEvolutionContainer = document.getElementById('compSectorProfileEvolutionContainer');
    elements.compSectorProfileEvolutionText = document.getElementById('compSectorProfileEvolutionText');
    elements.compSectorProfileEvolutionSelect = document.getElementById('compSectorProfileEvolutionSelect');
    elements.compRacecraftDeltaCanvas = document.getElementById('compRacecraftDeltaCanvas');
    elements.compRacecraftDeltaContainer = document.getElementById('compRacecraftDeltaContainer');
    elements.compRacecraftDeltaText = document.getElementById('compRacecraftDeltaText');

    elements.viewHome = document.getElementById('view-home');
    elements.viewDashboard = document.getElementById('view-dashboard');
    elements.dashboardViews = {
        evaluation: document.getElementById('view-evaluation'),
        simulator: document.getElementById('view-simulator'),
        ai: document.getElementById('view-ai'),
        chat: document.getElementById('view-chat')
    };
    elements.aiRacedayViews = {
        rd1: document.getElementById('ai-view-RD1'),
        rd2: document.getElementById('ai-view-RD2'),
        comp: document.getElementById('ai-view-COMP')
    };
    
    elements.evaluationFilterGroup = document.getElementById('racedayFilterGroup');
    elements.aiFilterGroup = document.getElementById('aiRacedayFilterGroup');
    
    elements.evaluationFilterContainer = document.getElementById('raceday-filter-container');
    elements.aiFilterContainer = document.getElementById('ai-raceday-filter-container');
    elements.simulatorFilterContainer = document.getElementById('simulator-raceday-select-container');

    elements.analysisSettings = document.getElementById('analysisSettings');
    elements.analyzeButtonHome = document.getElementById('analyzeButtonHome');
    elements.updateAnalysisButton = document.getElementById('updateAnalysisButton');
    elements.exitButton = document.getElementById('exitButton');
    elements.navLinks = document.querySelectorAll('.nav-link');

    elements.apiKeySection = document.getElementById('apiKeySection');
    elements.geminiApiKeyInput = document.getElementById('geminiApiKey');
    elements.startChatButton = document.getElementById('startChatButton');
    elements.apiKeyError = document.getElementById('apiKeyError');
    elements.chatInterface = document.getElementById('chatInterface');
    elements.chatHistory = document.getElementById('chatHistory');
    elements.chatInput = document.getElementById('chatInput');
    elements.sendChatButton = document.getElementById('sendChatButton');
    elements.chatLoading = document.getElementById('chatLoading');
}