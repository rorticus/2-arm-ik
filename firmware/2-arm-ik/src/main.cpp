#include <Arduino.h>
#include "Servo.h"
#include "protocol.h"

Servo leg1;
Servo leg2;

Protocol protocol;

unsigned char leg1Position = 90;
unsigned char leg2Position = 90;

void setup() {
  leg1.attach(3);
  leg2.attach(5);

  protocol.attach();
}

char s[64];

void loop() {
  protocol.update();

  // process any incoming packets
  SerialPacket* packet = protocol.nextPacket();
  while(packet != nullptr) {
    switch (packet->command) {
      case COMMAND_SET_SERVO_POSITION:
      
      sprintf(s, "Received servo position command: leg1=%d, leg2=%d", packet->data[0], packet->data[1]);
      Serial.println(s);

        leg1Position = packet->data[0];
        leg2Position = packet->data[1];
        break;
    }

    packet = protocol.nextPacket();
  }

  leg1.write(leg1Position);
  leg2.write(leg2Position);
}

