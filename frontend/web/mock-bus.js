const mqtt = require('mqtt');

// --- Configuration ---
const BROKER_URL = 'mqtt://broker.hivemq.com';
const TOPIC_DATA = 'bus_tracker/data';
const TOPIC_WARNING = 'bus_tracker/warnings';

// --- Thresholds ---
const THRESHOLD_ACCEL = 2.0;
const THRESHOLD_DIST = 10.0;
const THRESHOLD_HEAT = 600.0;

// --- Simulation State ---
let busState = 'CRUISING'; // Options: STOPPED, ACCELERATING, CRUISING, BRAKING
let speed = 40; // km/h
let heading = 90; // 0=North, 90=East (Direction the bus is facing)
let cooldownTimer = 0; 

// Start exactly at the map center (Athens)
let currentData = {
    lat: 37.9838, 
    lng: 23.7275,
    accel_x: 0.05,
    distance: 250,
    temp: 24.5,
    students: 12
};

console.log('⏳ Connecting to MQTT Broker...');
const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
    console.log('✅ Mock Bus Connected!');
    console.log(`🚀 Sending GPS + Sensor data to: ${TOPIC_DATA}`);
    
    // Update every 1 second
    setInterval(simulateBusLoop, 1000);
});

function simulateBusLoop() {
    // 1. STATE MACHINE (Simulate driving behavior)
    const rand = Math.random();
    
    if (cooldownTimer > 0) {
        cooldownTimer--;
        busState = 'CRUISING'; 
    } else {
        // Randomly change states
        if (busState === 'CRUISING') {
            if (rand < 0.1) busState = 'BRAKING';
            else if (rand < 0.05) busState = 'ACCELERATING';
            else if (rand < 0.15) changeHeading(); // Turn corner
        } else if (busState === 'STOPPED') {
            if (rand < 0.3) busState = 'ACCELERATING';
        } else if (busState === 'BRAKING') {
            if (speed < 5) busState = 'STOPPED';
            else busState = 'CRUISING';
        } else if (busState === 'ACCELERATING') {
            if (speed > 50) busState = 'CRUISING';
        }
    }

    // 2. PHYSICS & GPS MATH
    let targetAccel = 0;
    let targetDist = currentData.distance;

    switch (busState) {
        case 'STOPPED':
            speed = 0;
            targetAccel = 0.0;
            targetDist = 150; 
            // Students get on/off when stopped
            if (Math.random() > 0.7) currentData.students += (Math.random() > 0.5 ? 1 : -1);
            if (currentData.students < 0) currentData.students = 0;
            break;
        case 'ACCELERATING':
            speed += 5;
            targetAccel = 0.4;
            targetDist = 400; 
            break;
        case 'BRAKING':
            speed -= 8;
            targetAccel = -0.6; 
            targetDist = 80;
            break;
        case 'CRUISING':
            targetAccel = 0.0; 
            targetDist = 300 + (Math.random() * 50); 
            break;
    }

    // --- CALCULATE NEW GPS COORDINATES ---
    if (speed > 0) {
        // Convert speed (km/h) to distance moved in 1 sec (meters)
        const distanceMeters = (speed * 1000) / 3600; 
        const earthRadius = 6378137; // meters

        // Calculate change in Lat/Lng
        const dLat = (distanceMeters * Math.cos(heading * Math.PI / 180)) / earthRadius;
        const dLng = (distanceMeters * Math.sin(heading * Math.PI / 180)) / (earthRadius * Math.cos(currentData.lat * Math.PI / 180));

        // Apply change (convert radians back to degrees)
        currentData.lat += (dLat * 180 / Math.PI);
        currentData.lng += (dLng * 180 / Math.PI);
    }

    // 3. SMOOTH SENSOR DATA
    currentData.accel_x = (currentData.accel_x * 0.6) + (targetAccel * 0.4) + ((Math.random() * 0.1) - 0.05);
    currentData.distance = (currentData.distance * 0.8) + (targetDist * 0.2);
    
    // Temp rises with speed
    const targetTemp = 24.0 + (speed / 10);
    currentData.temp = (currentData.temp * 0.95) + (targetTemp * 0.05);

    // 4. RARE WARNINGS (1% Chance)
    if (cooldownTimer === 0 && Math.random() < 0.01) { 
        const eventType = Math.random();
        if (eventType < 0.33) {
            currentData.accel_x = -2.8; busState = 'BRAKING'; // Hard Brake
        } else if (eventType < 0.66) {
            currentData.distance = 5.0; // Close Call
        } else {
            currentData.temp = 620.0; // Overheat
        }
        cooldownTimer = 10;
    }

    // 5. SEND PAYLOAD
    const payload = {
        lat: parseFloat(currentData.lat.toFixed(6)),
        lng: parseFloat(currentData.lng.toFixed(6)),
        accel_x: parseFloat(currentData.accel_x.toFixed(2)),
        distance: Math.round(currentData.distance),
        temp: parseFloat(currentData.temp.toFixed(1)),
        students: currentData.students
    };

    client.publish(TOPIC_DATA, JSON.stringify(payload));
    
    // Log for debugging
    const icon = speed === 0 ? '🛑' : '🚌';
    console.log(`[${icon}] Lat:${payload.lat} Lng:${payload.lng} | Spd:${speed}km/h | G:${payload.accel_x}`);

    // 6. SEND WARNINGS (If any)
    let warningMessage = "";
    if (Math.abs(payload.accel_x) >= THRESHOLD_ACCEL) warningMessage += `WARNING: Excessive G-Force (${payload.accel_x} g)`;
    if (payload.distance <= THRESHOLD_DIST) {
        if(warningMessage) warningMessage += " AND ";
        warningMessage += `WARNING: Proximity (${payload.distance} cm)`;
    }
    if (payload.temp > THRESHOLD_HEAT) {
        if(warningMessage) warningMessage += " AND ";
        warningMessage += `WARNING: Overheat (${payload.temp} C)`;
    }
    if (warningMessage) client.publish(TOPIC_WARNING, warningMessage);
}

function changeHeading() {
    // Turn 90 degrees left or right to simulate city streets
    heading += (Math.random() > 0.5 ? 90 : -90);
    // Add small noise so it's not robotic
    heading += (Math.random() * 10 - 5);
}