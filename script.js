async function fetchWeather(current = false, future = false) {
    const location = document.getElementById('locationInput').value;
    if (!location) {
        alert('Please enter a city or zip code');
        return;
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1&format=json`;

    try {
        const geoResponse = await fetch(geoUrl);
        if (!geoResponse.ok) {
            throw new Error('Location not found');
        }
        const geoData = await geoResponse.json();
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('No coordinates found for this location');
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        let apiUrl;
        if (current) {
            apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
        } else if (future) {
            apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=10`;
        } else {
            // Fetch past 9 days + today (last 10 days including today)
            apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&past_days=9`;
        }

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        const data = await response.json();

        let weatherHTML = `<h2>Weather for ${name}, ${country}</h2>`;

        if (current) {
            let tempC = data.current_weather.temperature;
            let tempF = convertCelsiusToFahrenheit(tempC);
            const weatherCode = data.current_weather.weathercode;
            const icon = getWeatherIcon(weatherCode);
            const { time, day } = getCurrentTimeAndDay();

            weatherHTML += `
                <h3>Current Weather</h3>
                <p><strong>${day}, ${time}</strong></p>
                <p>Temperature: ${tempF}°F <img src="${icon}" alt="Weather icon"></p>
            `;
        } else {
            weatherHTML += future ? '<h3>Next 10 Days Weather</h3>' : '<h3>Last 10 Days Weather</h3>';
            weatherHTML += '<div class="forecast-container">';

            // Ensure we only display exactly 10 days
            const totalDays = Math.min(10, data.daily.time.length);

            for (let i = 0; i < totalDays; i++) {
                const date = new Date(data.daily.time[i]).toDateString();
                let tempMaxC = data.daily.temperature_2m_max[i];
                let tempMinC = data.daily.temperature_2m_min[i];

                let tempMaxF = convertCelsiusToFahrenheit(tempMaxC);
                let tempMinF = convertCelsiusToFahrenheit(tempMinC);

                const weatherCode = data.daily.weathercode[i];
                const icon = getWeatherIcon(weatherCode);

                weatherHTML += `
                    <div class="forecast-item">
                        <p><strong>${date}</strong></p>
                        <p>🌡️ Max: ${tempMaxF}°F</p>
                        <p>❄️ Min: ${tempMinF}°F</p>
                        <p><img src="${icon}" alt="Weather icon"></p>
                    </div>
                `;
            }

            weatherHTML += '</div>';
        }

        document.getElementById('weatherResult').innerHTML = weatherHTML;
    } catch (error) {
        document.getElementById('weatherResult').innerHTML = '<p>Error fetching weather data.</p>';
    }
}

function resetSearch() {
    document.getElementById('locationInput').value = '';
    document.getElementById('weatherResult').innerHTML = '';
}

// Function to convert Celsius to Fahrenheit
function convertCelsiusToFahrenheit(celsius) {
    return ((celsius * 9) / 5 + 32).toFixed(1);  // Round to 1 decimal place
}

// Function to get weather icons
function getWeatherIcon(code) {
    const iconBaseUrl = 'https://www.weatherbit.io/static/img/icons/';
    const weatherIcons = {
        0: 'c01d.png', 1: 'c02d.png', 2: 'c03d.png', 3: 'c04d.png',
        45: 'a01d.png', 48: 'a02d.png', 51: 'd01d.png', 61: 'r01d.png',
        71: 's01d.png', 95: 't01d.png'
    };
    return iconBaseUrl + (weatherIcons[code] || 'u00d.png');
}

// Function to get current time and day
function getCurrentTimeAndDay() {
    const now = new Date();
    const options = { weekday: 'long' };
    const day = now.toLocaleDateString(undefined, options);
    const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return { time, day };
}
