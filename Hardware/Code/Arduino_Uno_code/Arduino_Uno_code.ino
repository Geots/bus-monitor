/***************************************************************
* Bus Tracker Sender Unit (Arduino Uno) 
*
* Purpose:
* Collects data from all local sensors (DHT22, ADXL343, HC-SR04, RFID) 
* and serializes it into a single JSON payload.
* The payload is transmitted via Hardware Serial (Pin 1 TX) to the
* ESP8266 for aggregation and MQTT publishing.
****************************************************************/
 
#include <Wire.h>             // I2C protocol for ADXL343
#include <SPI.h>              // SPI protocol for MFRC522
#include <Adafruit_ADXL343.h> // ADXL343 library
#include <MFRC522.h>          // MFRC522 RFID library
#include <DHT.h>              // DHT sensor library
#include <Adafruit_Sensor.h>  // Adafruit Unified Sensor support
 
// ------------------------------------------------------------------
// --- PIN DEFINITIONS AND SENSOR DECLARATIONS ---
// ------------------------------------------------------------------
 
// DHT (Temperature/Humidity)
#define DHTPIN 2
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE); 
 
// ADXL343 (Accelerometer)
// Connected via I2C (A4/A5)
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
#define BUZZER_PIN 5
#define LED_PIN A3 
 
// ------------------------------------------------------------------
// --- RFID STATE MANAGEMENT ---
// ------------------------------------------------------------------
byte CardA_UID[] = { 0xA3, 0x65, 0x19, 0xE2 }; // Student A UID
byte CardB_UID[] = { 0x11, 0x22, 0x33, 0x44 }; // Student B UID
const byte UID_SIZE = 4;
int tap_count_A = 0; 
int tap_count_B = 0; 
bool is_present_A = false; 
bool is_present_B = false; 
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
  // Clears the trigPin condition
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  // Sets the trigPin HIGH for 10 us
  digitalWrite(trigPin, HIGH); 
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  // Reads the echoPin, returns the sound wave travel time in microseconds
  long duration = pulseIn(echoPin, HIGH);
  // Calculating the distance in cm (duration / 58)
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
      temperatureC = 563.2; // Sends known "fault" value
    }
 
    // 2. Build JSON String (Payload without GPS)
    String jsonString = "{\"accel_x\":" + String(currentAccelX,2) + ",";
    jsonString += "\"accel_y\":" + String(currentAccelY,2) + ","; 
    jsonString += "\"accel_z\":" + String(currentAccelZ,2) + ","; 
    jsonString += "\"distance\":" + String(currentDist) + ",";
    jsonString += "\"temp\":" + String(temperatureC,1) + ",";
    jsonString += "\"students\":" + String(students_inside) + "}"; 
 
    // 3. Transmit JSON to ESP8266 via Hardware Serial (Pin 1 TX)
    Serial.println(jsonString); 
}
 
 
void setup() {
    // Hardware Serial for communication with ESP8266 (and USB debug if unplugged)
    Serial.begin(9600); 
    
    // Sensor Initializations
    dht.begin();
    if (adxl.begin()) { adxl.setRange(ADXL343_RANGE_8_G); adxl_init_ok = true; } 
    SPI.begin();
    mfrc522.PCD_Init(); 
    
    // Pin Modes
    pinMode(trigPin, OUTPUT); 
    pinMode(echoPin, INPUT);
    pinMode(BUZZER_PIN, OUTPUT); 
    pinMode(LED_PIN, OUTPUT);
}
 
void loop() {
    // 1. RFID/PRESENCE CHECK (Check-in/Check-out logic) - Omitted for brevity (same as original)
    // NOTE: RFID logic needs implementation here! 
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
        if (millis() - lastTagReadTime > debounceDelay) {
            String rfid_status = "";
            bool valid_tap = false;
            
            if (compareUID(mfrc522.uid.uidByte, CardA_UID, UID_SIZE)) {
                tap_count_A++; is_present_A = !is_present_A; 
                rfid_status = "CARD 1 TAPPED: " + String(is_present_A ? "IN" : "OUT");
                valid_tap = true;
            }
            else if (compareUID(mfrc522.uid.uidByte, CardB_UID, UID_SIZE)) {
                tap_count_B++; is_present_B = !is_present_B; 
                rfid_status = "CARD 2 TAPPED: " + String(is_present_B ? "IN" : "OUT"); 
                valid_tap = true;
            }
            
            if (valid_tap) {
                digitalWrite(BUZZER_PIN, HIGH); digitalWrite(LED_PIN, HIGH);
                delay(200); 
                digitalWrite(BUZZER_PIN, LOW); digitalWrite(LED_PIN, LOW);
            }
            lastTagReadTime = millis();
        }
        mfrc522.PICC_HaltA(); 
        mfrc522.PCD_StopCrypto1(); 
    }
    
    // 2. Send combined sensor data (JSON) to ESP8266
    sendData();
 
    delay(2000); // Send interval (2 seconds)
}
