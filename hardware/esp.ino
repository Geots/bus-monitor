// ΚΩΔΙΚΑΣ ESP8266 (RECEIVER & MQTT PUBLISHER) - ΤΕΛΙΚΗ ΕΚΔΟΧΗ ΜΕ SOFTWARE SERIAL & ΘΕΡΜΟΚΡΑΣΙΑ WARNING (Προσθήκη students)

#include <ESP8266WiFi.h> // Βιβλιοθήκη WiFi
#include <PubSubClient.h> // Βιβλιοθήκη MQTT
#include <ArduinoJson.h> // Βιβλιοθήκη JSON
#include <SoftwareSerial.h> // Βιβλιοθήκη Software Serial

// ----------------------------------------------------------------------
// --- ΡΥΘΜΙΣΕΙΣ SOFTWARE SERIAL ---
// ----------------------------------------------------------------------
// Uno TX (Pin 1) -> Level Shifter -> ESP8266 RX (GPIO14/D5)
// Uno RX (Pin 0) <- ESP8266 TX (GPIO12/D6)
static const int UNO_RX_PIN = 14; // GPIO14 (D5) - ΛΑΜΒΑΝΕΙ από Uno TX
static const int UNO_TX_PIN = 12; // GPIO12 (D6) - ΣΤΕΛΝΕΙ στο Uno RX
SoftwareSerial SerialUno(UNO_RX_PIN, UNO_TX_PIN); // Δήλωση Software Serial

// ----------------------------------------------------------------------
// --- ΡΥΘΜΙΣΕΙΣ WiFi / MQTT ---
// ----------------------------------------------------------------------
const char* ssid = "george_2.4"; 
const char* password = "21067432761"; 
const char* mqtt_server = "broker.hivemq.com"; 
const int mqtt_port = 1883;

// --- MQTT TOPICS ---
const char* DATA_TOPIC = "bus_tracker/data"; 
const char* WARNING_TOPIC = "bus_tracker/warnings"; 

// --- ΟΡΙΑ WARNINGS ---
const float ACCEL_THRESHOLD = 2.0; 
const float DISTANCE_THRESHOLD = 10.0; 
const float HEAT_THRESHOLD = 600.0; // Όριο υπερβολικής θερμότητας > 600

// --- ΔΗΛΩΣΕΙΣ ---
WiFiClient espClient; 
PubSubClient client(espClient);


// ----------------------------------------------------------------------
// --- ΣΥΝΑΡΤΗΣΗ WARNINGS ---
// ----------------------------------------------------------------------

void checkAndPublishWarnings(float accel_x, float distance, float temperature) { 
  
  String warningMessage = "";

  // 1. Έλεγχος Επιτάχυνσης 
  if (abs(accel_x) >= ACCEL_THRESHOLD) { 
    if (warningMessage.length() > 0) warningMessage += " AND ";
    warningMessage += "WARNING: Excessive Acceleration/Deceleration (" + String(accel_x, 2) + " g)";
  } 
  
  // 2. Έλεγχος Απόστασης 
  if (distance <= DISTANCE_THRESHOLD) {
    if (warningMessage.length() > 0) warningMessage += " AND ";
    warningMessage += "WARNING: Object in very close proximity (" + String(distance, 0) + " cm)";
  }

  // 3. Έλεγχος Θερμοκρασίας
  if (temperature > HEAT_THRESHOLD) { 
    if (warningMessage.length() > 0) warningMessage += " AND ";
    warningMessage += "WARNING: Excessive Heat (" + String(temperature, 1) + " C)";
  }

  // Αποστολή ειδοποίησης αν υπάρχει
  if (warningMessage.length() > 0) {
    client.publish(WARNING_TOPIC, warningMessage.c_str());
    Serial.print("--- WARNING SENT: ");
    Serial.println(warningMessage);
  }
}

// ----------------------------------------------------------------------
// --- SETUP & RECONNECT ---
// ----------------------------------------------------------------------

void setup() {
  Serial.begin(115200); // Hardware Serial 0 για debugging
  SerialUno.begin(9600); // Software Serial για επικοινωνία με το Uno (9600 baud)
  
  // Σύνδεση WiFi
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  
  // Ρύθμιση MQTT
  client.setServer(mqtt_server, mqtt_port);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    // Σύνδεση ΧΩΡΙΣ credentials
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

  // 1. Λήψη δεδομένων από το Uno
  if (SerialUno.available()) {
    String payload = SerialUno.readStringUntil('\n');
    payload.trim(); // Διατηρούμε το trim() για να αφαιρέσουμε τυχόν κενά/newlines

    Serial.print("Received from Uno (trimmed): "); 
    Serial.println(payload);

    // 2. Ανάλυση JSON
    StaticJsonDocument<300> doc; // Διατηρούμε το μέγεθος 300
    DeserializationError error = deserializeJson(doc, payload);

    if (error) {
      Serial.print("deserializeJson() failed: ");
      Serial.println(error.f_str());
      // Εκτυπώνουμε το payload για καλύτερο debugging
      Serial.print("Failing payload: "); Serial.println(payload);
      return;
    }

    // 3. Έλεγχος και Αποστολή Warnings
    if (client.connected()) {
        float accel_x = doc["accel_x"] | 0.0;
        float distance = doc["distance"] | 999.0;
        float temperature = doc["temp"] | -999.0; 
        int students = doc["students"] | 0; // <-- ΝΕΟ: Εξαγωγή students
        
        // Η συνάρτηση checkAndPublishWarnings δεν χρησιμοποιεί τους students
        // οπότε δεν χρειάζεται να την αλλάξουμε.
        checkAndPublishWarnings(accel_x, distance, temperature); 
        
        // 4. Αποστολή του ΠΛΗΡΟΥΣ JSON PAYLOAD μέσω MQTT
        client.publish(DATA_TOPIC, payload.c_str()); 
        Serial.print("MQTT Sent to ");
        Serial.print(DATA_TOPIC);
        Serial.println("!");
    }
  }
}