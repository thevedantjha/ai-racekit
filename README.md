# AI RaceKit
AI powered perception of race data.

---

## 🌟 Key Features
Upload the data for one race day OR for two different race days.
- ### **🔍 Evaluation**
    - **🔍 Driver Sector Evaluation:** Calculations and display of combined average sector time of all drivers vs average sector time of each driver.
    - **🔢 Driver Data Table:** A data table with calculations displaying raw average sector times and pit stop data.
    - **🔧 Tools:** Options to filter evaluation by lap flags and an option to exclude pit stop laps.
- ### **📊 AI Analysis**
    - **🏁 Theoretical Race:** A simulated graph, insights, and leaderboard that shows a theoretical race where every driver *consistently* ran their single best lap for the entire race.
    - **⚡️ Race Position vs. Pace (Over/Underperformers):** A chart and insights that compares a driver's final finishing position to their "Theoretical Pace Rank" (where they *should* have finished based on their single fastest lap).
    - **🔁 Consistency Analysis:** A chart and insights that shows the gap between a driver's single "hero" lap and their average race pace (from valid green-flag, non-pit laps).
    - **📉 Pace Degradation (Stint Analysis):** A chart and insights that shows the average green-flag, non-pit lap time for selected drivers during each quarter of the race.
    - **⚠️ Costly Mistake Analysis (Worst Lap Delta):** A chart and insights that shows the time difference between a driver's average lap and their *single worst* green-flag, non-pit lap.
    - **🛠️ Pit Stop & Strategy Impact:** A chart that visualizes the total time lost in the pits for each driver, along with analysis.
    - **💪 Sector "Fingerprint" / Strength Profile:** A chart that compares their average sector times (on green-flag, non-pit laps) to the absolute best time set by *any* driver in that sector, along with analysis.
>
    - **☀️ IF MULTIPLE RACE DAY DATA ARE UPLOADED ☀️:**
    >
        - **📈 Driver Pace Evolution:** A chart along with insights that shows the change in each driver's average green-flag, non-pit lap time.
        - **🧼 Consistency Delta:** A chart and analysis that shows the change in a driver's "Consistency Gap" (Avg Lap vs. Best Lap) between days.
        - **🚀 Pace Development Quadrant (Best Lap vs. Avg Lap):** A scatter plot and insights that shows *how* drivers improved.
        - **🗺️ Driver Sector Profile Evolution:** A chart that compares between two days their average sector times (on green-flag, non-pit laps) to the absolute best time set by *any* driver in that sector, along with analysis.
        - **🧠 Racecraft Delta (Over/Underperformance Shift):** A graph and insights that compares their (Theoretical Rank - Actual Position) score from both race days.
- ### **🏎️ Track Lap Simulator**
    - **🚦 Track Presets & Custom Tracks:** Choose from predefined track presets or enter custom sector lengths to create your own virtual track.
        - The simulator represents the track as a circular loop divided into three colored sectors.
        - Each sector’s arc length is proportional to its configured length (for both presets and custom tracks).
    - **👤 Driver Selection:** Pick any available driver to simulate their lap performance on the chosen track.
    - **Simulation Controls:**
        - ⏯️ Pause / Resume / Reset the simulation at any time.
        - ⚙️ Adjust Simulation Speed to run the lap slower or faster.
    - **👁️ Visual Representation:** The track is displayed as a circular progress indicator divided into 3 colors—each representing one sector. The driver’s position moves around the track according to lap progress and sector times. A timer is displayed in the center of the track.
- ### **💬 Chat**
    - **🤖 LLM Powered Chat:** Ask anything ranging from driver performance, consistency, pit stops, or anything else.
        - The AI model has the context of all analysis and evaluation data.
    - **☁️ Powered by Gemini 2.5 Flash:** A powerful cloud-based LLM model.
        - Must enter Gemini API key.

---

## ✅ Usage

**➡️ Visit: [thevedantjha.github.io/ai-racekit](https://thevedantjha.github.io/ai-racekit)**

### OR

1. Clone or download this repository.
2. Open a terminal in the project root and run: `python3 -m http.server 8000`
3. Open `http://localhost:8000` in a web browser.

> **Note:** Make sure Python 3 is installed on your system.
---

## 🔒 Privacy
- If NOT using AI Chat:
    - No tracking.
    - No data collection.
- ONLY IF using AI Chat:
    - Analysis and evaluation data will be sent to Google Gemini servers.
    - View how your data is being used: [Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms#data-use-paid).

---

## 📄 License
MIT License

---

## 🙌 Acknowledgements
- [Papa Parse](https://www.papaparse.com) for CSV parsing
- [Chart.js](https://www.chartjs.org) for charts
- [Gemini 2.5 Flash Image (Nano Banana)](https://aistudio.google.com/models/gemini-2-5-flash-image) for `background.png`
- [Gemini 2.5 Flash](https://deepmind.google/models/gemini/flash/) model