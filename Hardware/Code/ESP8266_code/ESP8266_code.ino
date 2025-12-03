/***************************************************************
* Bus Tracker Receiver Unit (ESP8266) 
*
****************************************************************/
 
#include <ESP8266WiFi.h> 
#include <PubSubClient.h> 
#include <ArduinoJson.h> 
#include <SoftwareSerial.h> 
#include <TinyGPSPlus.h> 

// ----------------------------------------------------------------------
// --- PIN CONFIGURATION & SERIAL OBJECTS ---
// ... (Pins remain the same) ...

// GPS SoftwareSerial (D8/D7)
static const int GPS_RX_PIN = 15; // D8 <- Garmin TX
static const int GPS_TX_PIN = 13; // D7 -> Garmin RX
static const long GPS_BAUD = 9600; 
SoftwareSerial SerialGarmin(GPS_RX_PIN, GPS_TX_PIN); 
TinyGPSPlus gps; 

// UNO SoftwareSerial (D6/D5) - Releasing Hardware Serial for debug
const long UNO_BAUD = 9600; 
SoftwareSerial SerialUno(14, 12); // D5/D6

// ----------------------------------------------------------------------
// --- MQTT & WI-FI CREDENTIALS ---
// ... (Credentials remain the same) ...
const char* ssid = "george_2.4"; 
const char* password = "21067432761"; 
const char* mqtt_server = "broker.hivemq.com"; 
const int mqtt_port = 1883;
const char* DATA_TOPIC = "bus_tracker/data"; 
const char* WARNING_TOPIC = "bus_tracker/warnings"; 

// --- EXPANDED WARNING THRESHOLDS ---
const float ACCEL_ROUGH_THRESHOLD = 1.5;    // G 
const float ACCEL_ACCIDENT_THRESHOLD = 3.0; // G 
const float HIGH_TEMP_THRESHOLD = 45.0;     // Celsius 
const float DISTANCE_THRESHOLD = 5.0;       // cm 
const float DHT_ERROR_CODE = 563.2;         // Code sent by Uno when DHT fails
const int GPS_NO_FIX_THRESHOLD = 0;         // Minimum satellites required for a fix
const float SPEED_THRESHOLD_KMPH = 80.0;    // NEW: Overspeeding limit (in km/h)

WiFiClient espClient; 
PubSubClient client(espClient);

// ----------------------------------------------------------------------
// --- WARNING LOGIC FUNCTION ---
// ----------------------------------------------------------------------

void checkAndPublishWarnings(float accel_x, float accel_y, float accel_z, 
                             float distance, float temperature, int satellites, float speed_kmph) { 
  String warningMessage = "";
  
  // 1. Check for Excessive Acceleration (Accident/High Impact)
  float current_g = max(abs(accel_x), abs(accel_y)); 

  if (current_g >= ACCEL_ACCIDENT_THRESHOLD) { 
    if (warningMessage.length() > 0) warningMessage += " AND ";
    warningMessage += "CRITICAL: Severe Accident/Impact Detected (" + String(current_g, 2) + " G)";
  } 
  else if (current_g >= ACCEL_ROUGH_THRESHOLD) { 
    if (warningMessage.length() > 0) warningMessage += " AND ";
    warningMessage += "WARNING: Rough Driving/Braking (" + String(current_g, 2) + " G)";
  }

  // 2. NEW: Check for Overspeeding (GPS)
  if (speed_kmph > SPEED_THRESHOLD_KMPH && satellites > 0) { 
    if (warningMessage.length() > 0) warningMessage += " AND ";
    warningMessage += "DANGER: Excessive Speed (" + String(speed_kmph, 1) + " km/h)";
  }

  // 3. Check Close Proximity Distance (HC-SR04)
  if (distance <= DISTANCE_THRESHOLD) {
    if (warningMessage.length() > 0) warningMessage += " AND ";
    warningMessage += "WARNING: Object in very close proximity (" + String(distance, 0) + " cm)";
  }

  // 4. Check Excessive Heat (DHT22)
  if (temperature >= HIGH_TEMP_THRESHOLD) { 
    if (warningMessage.length() > 0) warningMessage += " AND ";
    warningMessage += "WARNING: Cabin Overheat (" + String(temperature, 1) + " C)";
  }
  
  // 5. Check DHT Sensor Failure (using the error code)
  if (temperature >= DHT_ERROR_CODE) { 
    if (warningMessage.length() > 0) warningMessage += " AND ";
    warningMessage += "FAULT: Temperature Sensor Failure (Code 614.4)";
  }
  
  // 6. Check GPS Signal Loss
  if (satellites <= GPS_NO_FIX_THRESHOLD) { 
    if (warningMessage.length() > 0) warningMessage += " AND ";
    warningMessage += "FAULT: GPS Signal Loss (0 Satellites)";
  }
  
  // Publish warning if any condition is met
  if (warningMessage.length() > 0) {
    client.publish(WARNING_TOPIC, warningMessage.c_str());
    Serial.print("--- WARNING SENT: ");
    Serial.println(warningMessage);
  }
}
// ----------------------------------------------------------------------
// --- GPS HANDLING FUNCTIONS (Remain the same) ---
// ----------------------------------------------------------------------

void forceGarminToNMEA() {
    byte NMEA_Switch_Command[] = {
        0xFE, 0x00, 0x01, 0x02, 0x00, 0x01, 0xFE
    };

    Serial.println(F("Attempting to force GPS output mode to NMEA 0183..."));
    
    for (int i = 0; i < 3; i++) {
        SerialGarmin.write(NMEA_Switch_Command, sizeof(NMEA_Switch_Command));
        delay(50); 
    }
}

void readGpsData() {
  while (SerialGarmin.available() > 0) {
    gps.encode(SerialGarmin.read());
  }
}

// ----------------------------------------------------------------------
// --- SETUP & RECONNECT (Remain the same) ---
// ----------------------------------------------------------------------

void setup() {
  Serial.begin(115200); 
  Serial.println(F("\n--- ESP8266 Initialized ---"));
  
  SerialUno.begin(UNO_BAUD); 

  SerialGarmin.begin(GPS_BAUD); 

  forceGarminToNMEA();

  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  
  Serial.println("\nWiFi connected!");

  client.setServer(mqtt_server, mqtt_port);
}

void reconnect() {
  Serial.print("Attempting MQTT connection...");
  
  while (!client.connected()) {
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) { 
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" Retrying in 5 seconds");
      delay(5000);
    }
  }
}

// ----------------------------------------------------------------------
// --- LOOP ---
// ----------------------------------------------------------------------

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
 
  // 1. Read GPS Data from Garmin
  readGpsData();

  // 2. Receive JSON payload from Uno (Software Serial)
  if (SerialUno.available()) {
    String payload = SerialUno.readStringUntil('\n');
    payload.trim(); 
 
    Serial.print("Received from Uno (trimmed): "); 
    Serial.println(payload);

    // 3. Parse JSON
    StaticJsonDocument<500> doc; 
    DeserializationError error = deserializeJson(doc, payload);
 
    if (error) { 
        Serial.print("deserializeJson() failed: ");
        Serial.println(error.f_str());
        return;
    }
 
    // 4. AGGREGATE GPS DATA INTO THE JSON DOCUMENT
    float current_sats = gps.satellites.isValid() ? gps.satellites.value() : 0; 
    
    if (gps.location.isValid()) {
      doc["gps_lat"] = gps.location.lat();
      doc["gps_lng"] = gps.location.lng();
      doc["gps_speed"] = gps.speed.kmph(); // Speed in km/h is extracted here
      doc["gps_sats"] = current_sats;
    } else {
      doc["gps_lat"] = 0.0;
      doc["gps_lng"] = 0.0;
      doc["gps_speed"] = 0.0;
      doc["gps_sats"] = current_sats; 
    }

    // 5. Serialize the combined JSON and Publish
    if (client.connected()) {
        // Extract all required values for warning checks
        float accel_x = doc["accel_x"] | 0.0;
        float accel_y = doc["accel_y"] | 0.0;
        float accel_z = doc["accel_z"] | 0.0;
        float distance = doc["distance"] | 999.0;
        float temperature = doc["temp"] | -999.0; 
        float speed_kmph = doc["gps_speed"] | 0.0; // NEW: Get speed for warning check
        int students_sats = doc["gps_sats"] | 0; // Get satellites for warning check

        String mqttPayload;
        serializeJson(doc, mqttPayload);
        
        // Pass all necessary variables to the warning function
        checkAndPublishWarnings(accel_x, accel_y, accel_z, distance, temperature, students_sats, speed_kmph); 
        
        client.publish(DATA_TOPIC, mqttPayload.c_str()); 
    }
  }
}
