import { elements as dom } from './dom.js';

export function uiShowError(message) {
    dom.errorMessage.textContent = `Error: ${message}`;
    dom.errorMessage.classList.remove('hidden');
    dom.loadingSpinner.classList.add('hidden');
    dom.analyzeButtonHome.classList.remove('hidden');
}

export function uiShowMappingError(message) {
    dom.mappingErrorMessage.textContent = `Error: ${message}`;
    dom.mappingErrorMessage.classList.remove('hidden');
}

export function uiClearMappingError() {
    dom.mappingErrorMessage.textContent = '';
    dom.mappingErrorMessage.classList.add('hidden');
}

export function uiShowFileUploadError(message) {
    dom.fileUploadErrorMessage.textContent = `Error: ${message}`;
    dom.fileUploadErrorMessage.classList.remove('hidden');
}

export function uiClearFileUploadError() {
    dom.fileUploadErrorMessage.textContent = '';
    dom.fileUploadErrorMessage.classList.add('hidden');
}

