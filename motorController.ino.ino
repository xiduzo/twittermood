#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// What mood type is the starting mood type to control with this arduino
const int startingMood = 1;
// How many motors does this arduino control
const int motorsToControl = 4;


// WIFI
const char* ssid = "iPhone van Sander";
const char* password = "bierislekker";

// API
const String apiRoot = "http://22cb6940.ngrok.io/";
const String moodUrl = apiRoot + "mood/";
const String stateUrl = apiRoot + "states/";
const int apiRequestInterval = 1; // In minutes

//--------------------//
//    DO NOT TOUCH    //
//     BELOW THIS     //
//--------------------//
int currentValues[motorsToControl];
int moodTypes[motorsToControl];
bool gotCurrentValuesFromServer = false;

void setup() {
  Serial.begin(9600);

  for(int i = 0; i < motorsToControl; i++) {
    currentValues[i] = 0;
    moodTypes[i] = startingMood + i;
  }

  pinMode(D1, OUTPUT);
  pinMode(D2, OUTPUT);
  pinMode(D3, OUTPUT);
  pinMode(D4, OUTPUT);
  pinMode(D5, OUTPUT);
  pinMode(D6, OUTPUT);
  pinMode(D7, OUTPUT);
  pinMode(D8, OUTPUT);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    Serial.println("Connecting to the magical world wide web...");
    delay(1000);
  }

}

void loop() {
  // Check Wifi status
  if (WiFi.status() == WL_CONNECTED) {
    if(!gotCurrentValuesFromServer) {
      Serial.println("Getting current statusus of the motors");
      getCurrentMotorStatusesFromServer();
      Serial.println("Motor statusus set");
    } else {
      Serial.println("Getting new motor percentages");
      updateMotorStatusus();
      Serial.println("Updated the motors");
      delay(1000 * 60 * apiRequestInterval); // Wait time for next requests
    }
  } else {
    Serial.println("No internet connection available");
    delay(1000);
  }

}

void turnMotor(int percentageDifference, int motorPin, float timeToPowerMotorPerPercentage) {
  int pin;

  if(motorPin == 0) {
    pin = D1;
  } else if(motorPin == 1) {
    pin = D2;
  } else if(motorPin == 2) {
    pin = D3;
  } else if(motorPin == 3) {
    pin = D4;
  } else if(motorPin == 4) {
    pin = D5;
  } else if(motorPin == 5) {
    pin = D6;
  } else if(motorPin == 6) {
    pin = D7;
  } else {
    pin = D8;
  }

  // For debugging
  Serial.print("Turning on pin ");
  Serial.print(motorPin);
  Serial.print(" for ");
  Serial.print(1000 * (timeToPowerMotorPerPercentage * percentageDifference));
  Serial.println(" ms");

  // Power on
  digitalWrite(pin, HIGH);
  // Wait
  delay(1000 * (timeToPowerMotorPerPercentage * percentageDifference));
  // Power off
  digitalWrite(pin, LOW);
}

void updateMotorStatusus() {
  for(int i = 0; i < motorsToControl; i++) {
    String requestUrl = moodUrl + moodTypes[i];

    JsonObject& state = makeHttpRequest(requestUrl);

    int currentValue = currentValues[i];
    int newValue = state["percentage"];
    float pull = state["pull"];
    float push = state["push"];

    if(currentValue < newValue) {
      // Pull wire from motor
      turnMotor((newValue - currentValue), i * 2 + 1, pull);
    } else if(currentValue > newValue) {
      // Push wire to motor
      turnMotor((currentValue - newValue), i * 2, push);
    }

    // Update the current value
    currentValues[i] = newValue;

    // Just for debugging
    Serial.print("Update motor ");
    Serial.print(startingMood+i);
    Serial.print(" state to ");
    Serial.println(currentValues[i]);

  }
}

void getCurrentMotorStatusesFromServer() {
  // Go trough all the motors controlled by this arduino and get their current state from the server
  for(int i = 0; i < motorsToControl; i++) {
    String requestUrl = stateUrl + moodTypes[i];

    JsonObject& state = makeHttpRequest(requestUrl);

    currentValues[i] = state["percentage"]; // Update the current value

    // Just for debugging
    Serial.print("Motor ");
    Serial.print(startingMood+i);
    Serial.print(" state set to ");
    Serial.println(currentValues[i]);

  }

  gotCurrentValuesFromServer = true;
}

JsonObject& makeHttpRequest(String requestUrl) {
  Serial.println(requestUrl);
  StaticJsonBuffer<200> jsonBuffer;
//  DynamicJsonBuffer jsonBuffer;

  HTTPClient http;
  http.begin(requestUrl);

  // Send the request
  int httpCode = http.GET();

  if(httpCode > 0) {
    String payload = http.getString();
    http.end();

    return jsonBuffer.parseObject(payload);
  }

  //  TODO return something when there is an error with the server (?)

  http.end();

}
