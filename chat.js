import { elements as dom } from './dom.js';

let geminiApiKey = "";
let chatContext = "";

export function initChatContext(fullAnalysisData, hasRd2) {
    chatContext = buildFullDataContext(fullAnalysisData, hasRd2);
    dom.chatHistory.innerHTML = '<div class="message ai"><p>Hello! I have analyzed the race data. Ask me anything about driver performance, consistency, pit stops, or theoretical outcomes.</p></div>';
}

export function resetChat() {
    dom.apiKeySection.classList.remove('hidden');
    dom.chatInterface.classList.add('hidden');
    dom.chatHistory.innerHTML = '<div class="message ai"><p>Hello! I have analyzed the race data. Ask me anything about driver performance, consistency, pit stops, or theoretical outcomes.</p></div>';
    dom.geminiApiKeyInput.value = "";
    geminiApiKey = "";
    chatContext = "";
    dom.apiKeyError.classList.add('hidden');
    dom.apiKeyError.textContent = "";
}

export function handleStartChat() {
    const key = dom.geminiApiKeyInput.value.trim();
    if (key) {
        geminiApiKey = key;
        dom.apiKeySection.classList.add('hidden');
        dom.chatInterface.classList.remove('hidden');
        dom.apiKeyError.classList.add('hidden');
    } else {
        dom.apiKeyError.textContent = 'Please enter a valid API key.';
        dom.apiKeyError.classList.remove('hidden');
    }
}

export async function handleSendChat() {
    const userPrompt = dom.chatInput.value.trim();
    if (!userPrompt || dom.chatLoading.classList.contains('hidden') === false) {
        return;
    }

    addMessageToChat('user', userPrompt);
    dom.chatInput.value = '';
    dom.chatInput.style.height = '50px';
    dom.chatLoading.classList.remove('hidden');

    try {
        const aiResponse = await callGeminiAPI(userPrompt, chatContext);
        addMessageToChat('ai', aiResponse);
    } catch (error) {
        console.error('Gemini API Error:', error);
        addMessageToChat('error', `Error: ${error.message}. Check the console and make sure your API key is correct.`);
    } finally {
        dom.chatLoading.classList.add('hidden');
    }
}

function buildFullDataContext(data, hasRd2) {
    let context = "You are an expert race data analyst named RaceKit. The user has provided you with several data sets from a race. Analyze this data to answer the user's questions. Format your answers clearly using Markdown (headers, lists, tables, bold text).\n\n";

    if (hasRd2) {
        context += "IMPORTANT: You have data for TWO racedays (RD1 and RD2) and a 'Comparative' analysis. When the user asks a question, first determine if they are asking about RD1, RD2, or a comparison. Use the correct data set.\n\n";
    } else {
        context += "You have data for a single raceday (RD1). All data provided is for this single event.\n\n";
    }

    try {
        if (data.rd1 && data.rd1.analysisData && data.rd1.analysisData.length > 0) {
            context += "=== [START] Raceday 1 (RD1) Data ===\n";
            context += "--- RD1 Core Driver Analysis (Filtered Laps) ---\n";
            context += JSON.stringify(data.rd1.analysisData.map(d => ({
                Position: d.POS, Driver: d.NUMBER, Avg_S1: d.S1_Avg > 0 ? d.S1_Avg.toFixed(3) : 'N/A', Avg_S2: d.S2_Avg > 0 ? d.S2_Avg.toFixed(3) : 'N/A', Avg_S3: d.S3_Avg > 0 ? d.S3_Avg.toFixed(3) : 'N/A', PitStops: d.Pit_Stops, TotalPitTime: d.Total_Pit_Time_s.toFixed(1)
            })), null, 2) + "\n\n";
            
            context += "--- RD1 Theoretical Best Lap Race Analysis ---\n";
            context += JSON.stringify(data.rd1.bestLapData.map(d => ({
                Driver: d.number, ActualPosition: d.actualPos, TheoreticalRank: d.theoreticalRank, BestLapTime_s: d.bestLapTime_s > 0 ? d.bestLapTime_s.toFixed(3) : 'N/A', TheoreticalRaceTime_s: d.theoreticalTime_s > 0 ? d.theoreticalTime_s.toFixed(0) : 'N/A'
            })), null, 2) + "\n\n";

            context += "--- RD1 Consistency Gap Analysis ---\n";
            context += JSON.stringify(data.rd1.combinedData.filter(d => !isNaN(d.delta)).map(d => ({
                Driver: d.NUMBER, Position: d.POS, ConsistencyGap_s: d.delta.toFixed(3), AvgLapTime_s: d.avgLapTime.toFixed(3), BestLapTime_s: d.bestLapTime.toFixed(3)
            })), null, 2) + "\n\n";
            
            context += "--- RD1 Costly Mistake Analysis ---\n";
            context += JSON.stringify(data.rd1.dataWithWorstLap.filter(d => !isNaN(d.worstLapDelta)).map(d => ({
                Driver: d.NUMBER, Position: d.POS, WorstLapDelta_s: d.worstLapDelta.toFixed(3), WorstLapTime_s: d.worstLapTime.toFixed(3), AvgLapTime_s: d.avgLapTime.toFixed(3)
            })), null, 2) + "\n\n";

            if (data.rd1.driversWithPits) {
                context += "--- RD1 Pit Stop Analysis ---\n";
                context += JSON.stringify(data.rd1.driversWithPits.map(d => ({
                    Driver: d.NUMBER, Position: d.POS, PitStops: d.Pit_Stops, TotalPitTime_s: d.Total_Pit_Time_s.toFixed(1)
                })), null, 2) + "\n\n";
            }
            
            context += "=== [END] Raceday 1 (RD1) Data ===\n\n";
        }

        if (hasRd2 && data.rd2 && data.rd2.analysisData && data.rd2.analysisData.length > 0) {
            context += "=== [START] Raceday 2 (RD2) Data ===\n";
            context += "--- RD2 Core Driver Analysis (Filtered Laps) ---\n";
            context += JSON.stringify(data.rd2.analysisData.map(d => ({
                Position: d.POS, Driver: d.NUMBER, Avg_S1: d.S1_Avg > 0 ? d.S1_Avg.toFixed(3) : 'N/A', Avg_S2: d.S2_Avg > 0 ? d.S2_Avg.toFixed(3) : 'N/A', Avg_S3: d.S3_Avg > 0 ? d.S3_Avg.toFixed(3) : 'N/A', PitStops: d.Pit_Stops, TotalPitTime: d.Total_Pit_Time_s.toFixed(1)
            })), null, 2) + "\n\n";
            
            context += "--- RD2 Theoretical Best Lap Race Analysis ---\n";
            context += JSON.stringify(data.rd2.bestLapData.map(d => ({
                Driver: d.number, ActualPosition: d.actualPos, TheoreticalRank: d.theoreticalRank, BestLapTime_s: d.bestLapTime_s > 0 ? d.bestLapTime_s.toFixed(3) : 'N/A', TheoreticalRaceTime_s: d.theoreticalTime_s > 0 ? d.theoreticalTime_s.toFixed(0) : 'N/A'
            })), null, 2) + "\n\n";

            context += "--- RD2 Consistency Gap Analysis ---\n";
            context += JSON.stringify(data.rd2.combinedData.filter(d => !isNaN(d.delta)).map(d => ({
                Driver: d.NUMBER, Position: d.POS, ConsistencyGap_s: d.delta.toFixed(3), AvgLapTime_s: d.avgLapTime.toFixed(3), BestLapTime_s: d.bestLapTime.toFixed(3)
            })), null, 2) + "\n\n";
            
            context += "--- RD2 Costly Mistake Analysis ---\n";
            context += JSON.stringify(data.rd2.dataWithWorstLap.filter(d => !isNaN(d.worstLapDelta)).map(d => ({
                Driver: d.NUMBER, Position: d.POS, WorstLapDelta_s: d.worstLapDelta.toFixed(3), WorstLapTime_s: d.worstLapTime.toFixed(3), AvgLapTime_s: d.avgLapTime.toFixed(3)
            })), null, 2) + "\n\n";

            if (data.rd2.driversWithPits) {
                context += "--- RD2 Pit Stop Analysis ---\n";
                context += JSON.stringify(data.rd2.driversWithPits.map(d => ({
                    Driver: d.NUMBER, Position: d.POS, PitStops: d.Pit_Stops, TotalPitTime_s: d.Total_Pit_Time_s.toFixed(1)
                })), null, 2) + "\n\n";
            }
            
            context += "=== [END] Raceday 2 (RD2) Data ===\n\n";
        }

        if (hasRd2 && data.comp && data.comp.paceEvolutionData && data.comp.paceEvolutionData.length > 0) {
            context += "=== [START] Comparative (RD1 vs. RD2) Data ===\n";
            context += "--- Pace Evolution (RD2 Avg Lap - RD1 Avg Lap) ---\n";
            context += JSON.stringify(data.comp.paceEvolutionData, null, 2) + "\n\n";
            
            context += "--- Consistency Delta (RD2 Gap - RD1 Gap) ---\n";
            context += JSON.stringify(data.comp.consistencyDeltaData, null, 2) + "\n\n";
            
            context += "--- Racecraft Delta (RD2 Score - RD1 Score) ---\n";
            context += JSON.stringify(data.comp.racecraftDeltaData, null, 2) + "\n\n";
            
            context += "--- Pace Quadrant (x: BestLapDelta, y: AvgLapDelta) ---\n";
            context += JSON.stringify(data.comp.paceQuadrantData, null, 2) + "\n\n";
            context += "=== [END] Comparative (RD1 vs. RD2) Data ===\n\n";
        }

    } catch (e) {
        console.error("Error building data context:", e);
        context += "Error: Could not serialize all analysis data for context.\n\n";
    }
    
    return context;
}


async function callGeminiAPI(userPrompt, context) {
    const model = "gemini-2.5-flash-preview-09-2025";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

    const systemInstruction = {
        parts: [{ text: context }]
    };

    const contents = [
        {
            role: "user",
            parts: [{ text: userPrompt }]
        }
    ];

    const payload = {
        systemInstruction: systemInstruction,
        contents: contents
    };
    
    const response = await fetchWithBackoff(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`API Error ${response.status}: ${errorBody.error.message}`);
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts[0].text) {
        const text = result.candidates[0].content.parts[0].text;
        return text;
    } else if (result.promptFeedback) {
         throw new Error(`Request was blocked. Reason: ${result.promptFeedback.blockReason}`);
    } else {
        throw new Error('No content generated. Check your API key and quotas.');
    }
}

async function fetchWithBackoff(url, options, retries = 5, delay = 1000) {
    try {
        const response = await fetch(url, options);
        if (response.status === 429 && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithBackoff(url, options, retries - 1, delay * 2);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithBackoff(url, options, retries - 1, delay * 2);
        }
        throw error;
    }
}

function addMessageToChat(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender === 'user') {
        messageDiv.innerHTML = `<p>${text}</p>`;
    } else {
        messageDiv.innerHTML = formatChatText(text);
    }

    dom.chatHistory.appendChild(messageDiv);
    dom.chatHistory.scrollTop = dom.chatHistory.scrollHeight;
}

function formatChatText(text) {
    const lines = text.split('\n');
    let html = '';
    let inTable = false;
    let inList = false;
    let inTableHead = true;

    for (const line of lines) {
        if (line.startsWith('|')) {
            if (!inTable) {
                html += '<div style="overflow-x: auto;"><table>';
                inTable = true;
                inTableHead = true;
            }
            
            if (line.match(/\| *:?---*:? \|/)) {
                inTableHead = false;
                html += '<tbody>';
                continue;
            }

            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            
            if (inTableHead) {
                html += '<thead><tr>';
                for (const cell of cells) {
                    html += `<th>${cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</th>`;
                }
                html += '</tr></thead>';
            } else {
                html += '<tr>';
                for (const cell of cells) {
                    html += `<td>${cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>`;
                }
                html += '</tr>';
            }
            continue;
        }
        if (inTable) {
            html += '</tbody></table></div>\n';
            inTable = false;
        }

        if (line.startsWith('* ') || line.startsWith('- ')) {
            if (!inList) {
                html += '<ul>\n';
                inList = true;
            }
            html += `<li>${line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>\n`;
            continue;
        }
        if (inList) {
            html += '</ul>\n';
            inList = false;
        }

        if (line.startsWith('## ')) {
            html += `<h3>${line.substring(3)}</h3>\n`;
            continue;
        }
        if (line.startsWith('### ')) {
            html += `<h4>${line.substring(4)}</h4>\n`;
            continue;
        }

        if (line.startsWith('---') || line.startsWith('***')) {
            html += '<hr>\n';
            continue;
        }

        if (line.trim() !== '') {
            html += `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>\n`;
        } else {
             html += '\n';
        }
    }

    if (inTable) html += '</tbody></table></div>';
    if (inList) html += '</ul>';

    html = html.replace(/(\n){3,}/g, '\n\n');

    return html;
}