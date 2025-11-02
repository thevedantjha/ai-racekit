export function parseTimeToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string' || timeStr.trim() === '') return NaN;
    try {
        const parts = timeStr.split(':');
        let seconds = 0;
        if (parts.length === 3) {
            seconds += parseFloat(parts[0]) * 3600;
            seconds += parseFloat(parts[1]) * 60;
            seconds += parseFloat(parts[2]);
        } else if (parts.length === 2) {
            seconds += parseFloat(parts[0]) * 60;
            seconds += parseFloat(parts[1]);
        } else if (parts.length === 1) {
            seconds += parseFloat(parts[0]);
        } else {
            return NaN;
        }
        return isNaN(seconds) ? NaN : seconds;
    } catch (e) {
        console.warn(`Could not parse time: ${timeStr}`);
        return NaN;
    }
}

export function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds - (hours * 3600) - (mins * 60) - secs) * 10);
    
    const secsStr = String(secs).padStart(2, '0');
    const minsStr = String(mins).padStart(2, '0');

    if (hours > 0) {
        return `${String(hours)}:${minsStr}:${secsStr}.${tenths}`;
    } else {
        return `${minsStr}:${secsStr}.${tenths}`;
    }
}

export const getAvg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

export const parseFile = (file, headerMap = null) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true, skipEmptyLines: true, delimiter: ';',
            transformHeader: h => h.trim(),
            complete: (results) => {
                if (headerMap) {
                    try {
                        const mappedData = results.data.map(row => {
                            const newRow = {};
                            for (const [appField, userHeader] of Object.entries(headerMap)) {
                                if (row.hasOwnProperty(userHeader)) {
                                    newRow[appField] = row[userHeader];
                                } else {
                                    newRow[appField] = undefined; 
                                }
                            }
                            return newRow;
                        });
                        resolve(mappedData);
                    } catch (e) {
                        reject(new Error(`Failed to map headers: ${e.message}`));
                    }
                } else {
                    resolve(results.data);
                }
            },
            error: (error) => reject(new Error(`Failed to parse ${file.name}: ${error.message}`))
        });
    });
};

export const getFileHeaders = (file) => {
     return new Promise((resolve, reject) => {
        Papa.parse(file, {
            preview: 1,
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            transformHeader: h => h.trim(),
            complete: (results) => {
                if (results.meta && results.meta.fields) {
                    resolve(results.meta.fields);
                } else {
                    reject(new Error(`Could not read headers from ${file.name}.`));
                }
            },
            error: (error) => reject(new Error(`Failed to parse headers from ${file.name}: ${error.message}`))
        });
    });
};


export const colors = ["#E6194B", "#3CB44B", "#FFE119", "#4363D8", "#F58231", "#911EB4", "#46F0F0", "#F032E6", "#BCF60C", "#FABEBE", "#008080", "#E6BEFF", "#9A6324", "#FFFAC8", "#800000", "#AAFFC3", "#808080", "#FFD8B1", "#000075", "#808080", "#FFFFFF", "#000000", "#FF5733", "#33FF57", "#3357FF"];
