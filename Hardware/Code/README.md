/code/uno_sender/

Contains the Arduino Uno firmware. Responsible for reading local sensors (ADXL343, DHT22, MFRC522, HC-SR04), managing local I/O (Buzzer/LED), and formatting the raw data into a JSON payload.

/code/esp_gateway/

Contains the ESP8266 firmware. Manages the dual-serial communication, performs Aggregation of sensor and GPS data, runs the Safety Logic (e.g., Overspeeding/Impact checks), and handles Wi-Fi/MQTT connectivity.