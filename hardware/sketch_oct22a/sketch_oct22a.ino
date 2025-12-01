/***************************************************************
* Bus Tracker Sender Unit (Arduino Uno)
*
* Purpose:
* Collects data from all connected sensors (GPS, RFID, DHT22,
* ADXL343, HC-SR04) and serializes it into a single JSON payload.
* The payload is transmitted via Hardware Serial (Pin 1 TX) to the
* ESP8266 for MQTT publishing.
*
* Communication:
* - Uno -> ESP8266: Hardware Serial (Pin 1 TX) at 9600 baud.
* - GPS -> Uno: Software Serial (Pins 3 & 4) at 9600 baud.
****************************************************************/

#include <Wire.h>             // I2C protocol for ADXL343
#include <SPI.h>              // SPI protocol for MFRC522
#include <Adafruit_ADXL343.h> // ADXL343 library
#include <MFRC522.h>          // MFRC522 RFID library
#include <DHT.h>              // DHT sensor library
#include <Adafruit_Sensor.h>  // Adafruit Unified Sensor support
#include <SoftwareSerial.h>   // Required for GPS communication
#include <TinyGPSPlus.h>      // GPS data parsing

// ------------------------------------------------------------------
// --- PIN DEFINITIONS AND SENSOR DECLARATIONS ---
// ------------------------------------------------------------------

// DHT (Temperature/Humidity)
#define DHTPIN 2
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE); 
// ADXL343 (Accelerometer)
Adafruit_ADXL343 adxl(-1, &Wire); 
bool adxl_init_ok = false;
// MFRC522 (RFID)
#define SS_PIN 10 
#define RST_PIN 9
MFRC522 mfrc522(SS_PIN, RST_PIN); 
 
// HC-SR04 (Ultrasonic Distance)
const int trigPin = 7; 
const int echoPin = 6; 
 
// LED/BUZZER (Confirmation/Alerts)
const int BUZZER_PIN = 5;
#define LED_PIN A3 // <-- ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε #define για να αναγνωρίσει το A3 σωστά
 
// GPS NEO-6M
static const int GPS_RX_PIN = 3; 
static const int GPS_TX_PIN = 4; 
static const long GPS_BAUD = 9600; 
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN); 
TinyGPSPlus gps; 

// --- MOCKED GPS COORDINATES FOR TESTING ---
const double MOCKED_LATITUDE = 37.9838; 
const double MOCKED_LONGITUDE = 23.7275; 
const float MOCKED_SPEED = 35.5; // km/h
const int MOCKED_SATS = 10;     // Satellites 

// ------------------------------------------------------------------
// --- RFID STATE MANAGEMENT ---
// ------------------------------------------------------------------
byte CardA_UID[] = { 0xA3, 0x65, 0x19, 0xE2 }; // Student A UID
byte CardB_UID[] = { 0x11, 0x22, 0x33, 0x44 }; // Student B UID
const byte UID_SIZE = 4;
int tap_count_A = 0; 
int tap_count_B = 0; 
bool is_present_A = false; // True if student A is currently inside
bool is_present_B = false; // True if student B is currently inside
unsigned long lastTagReadTime = 0;
const long debounceDelay = 2000; 

// ------------------------------------------------------------------
// --- HELPER FUNCTIONS ---
// ------------------------------------------------------------------
 
// Function to compare two UID byte arrays
bool compareUID(byte *buffer1, byte *buffer2, byte bufferSize) { 
  for (byte i = 0; i < bufferSize; i++) { 
    if (buffer1[i] != buffer2[i]) return false; 
  }
  return true;
}
 
// Function to measure distance using HC-SR04 sensor
int readDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH); 
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  return duration / 58; 
}
 
// ------------------------------------------------------------------
// --- DATA SERIALIZATION (JSON) ---
// ------------------------------------------------------------------
void sendData() {
    // 1. Data Collection
    float currentAccelX = 0;
    float currentAccelY = 0; 
    float currentAccelZ = 0; 
    
    if (adxl_init_ok) { 
        sensors_event_t event; 
        adxl.getEvent(&event);
        currentAccelX = event.acceleration.x;
        currentAccelY = event.acceleration.y; 
        currentAccelZ = event.acceleration.z; 
    }
    
    int currentDist = readDistanceCm(); 
    int students_inside = (int)is_present_A + (int)is_present_B; 
    float temperatureC = dht.readTemperature(); 

    // Handle NaN temperature readings
    if (isnan(temperatureC)) {
      // Print failure to the Uno's OWN Serial Monitor (for local debugging)
      Serial.println("Failed to read temperature from DHT sensor!"); 
      temperatureC = 563.2; 
    }
    
    // 2. Build JSON String (Using MOCKED GPS DATA)
    String jsonString = "{\"accel_x\":" + String(currentAccelX, 2) + ",";
    jsonString += "\"accel_y\":" + String(currentAccelY, 2) + ","; 
    jsonString += "\"accel_z\":" + String(currentAccelZ, 2) + ","; 
    jsonString += "\"distance\":" + String(currentDist) + ",";
    jsonString += "\"temp\":" + String(temperatureC, 1) + ",";
    jsonString += "\"students\":" + String(students_inside) + ",";
    jsonString += "\"gps_lat\":" + String(MOCKED_LATITUDE, 6) + ",";     // MOCKED LATITUDE
    jsonString += "\"gps_lng\":" + String(MOCKED_LONGITUDE, 6) + ",";    // MOCKED LONGITUDE
    jsonString += "\"gps_speed\":" + String(MOCKED_SPEED, 1) + ",";      // MOCKED SPEED
    jsonString += "\"gps_sats\":" + String(MOCKED_SATS) + "}";           // MOCKED SATS
 
    // 3. Transmit JSON to ESP8266 via Hardware Serial (Pin 1 TX)
    Serial.println(jsonString); 
}
 
 
void setup() {
    // Hardware Serial for communication with ESP8266 (9600 baud)
    Serial.begin(9600); 
    // Software Serial for communication with GPS
    gpsSerial.begin(GPS_BAUD); 
    
    // Sensor Initializations
    dht.begin();
    if (adxl.begin()) { adxl.setRange(ADXL343_RANGE_8_G); adxl_init_ok = true; } 
    SPI.begin();
    mfrc522.PCD_Init(); 
    
    // Pin Modes
    pinMode(trigPin, OUTPUT); 
    pinMode(echoPin, INPUT);
    pinMode(BUZZER_PIN, OUTPUT); 
    pinMode(LED_PIN, OUTPUT); // <-- Χρησιμοποιεί το A3
}
 
void loop() {
    // 1. RFID/PRESENCE CHECK (Check-in/Check-out logic)
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
        if (millis() - lastTagReadTime > debounceDelay) {
            String rfid_status = "";
            bool valid_tap = false;
            
            // Check Student A
            if (compareUID(mfrc522.uid.uidByte, CardA_UID, UID_SIZE)) {
                tap_count_A++; is_present_A = !is_present_A; // Toggle state
                rfid_status = "CARD 1 TAPPED: " + String(is_present_A ? "IN" : "OUT");
                valid_tap = true;
            }
            // Check Student B
            else if (compareUID(mfrc522.uid.uidByte, CardB_UID, UID_SIZE)) {
                tap_count_B++; is_present_B = !is_present_B; // Toggle state
                rfid_status = "CARD 2 TAPPED: " + String(is_present_B ? "IN" : "OUT"); 
                valid_tap = true;
            }
 
            // --- CHECK-IN CONFIRMATION (LED & BUZZER) ---
            if (valid_tap) {
                digitalWrite(BUZZER_PIN, HIGH); digitalWrite(LED_PIN, HIGH);
                delay(200); 
                digitalWrite(BUZZER_PIN, LOW); digitalWrite(LED_PIN, LOW);
                // Serial.println(rfid_status); // Debugging RFID
            }
            lastTagReadTime = millis();
        }
        mfrc522.PICC_HaltA(); 
        mfrc522.PCD_StopCrypto1(); 
    }
    
    // 2. Read GPS data (Still reading, but mocked data used in JSON)
    while (gpsSerial.available() > 0) {
        gps.encode(gpsSerial.read());
    }

    // 3. Send combined sensor data (JSON) to ESP8266
    sendData();
 
    delay(2000); // Send interval (2 seconds)
}