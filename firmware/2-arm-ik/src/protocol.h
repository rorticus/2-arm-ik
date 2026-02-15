#pragma once

typedef struct {
    unsigned char command;
    unsigned char data[3];
    unsigned char checksum;
} SerialPacket;

#define COMMAND_SET_SERVO_POSITION 0x01

class Protocol {
    public:
        void attach();
        void update();

        SerialPacket *nextPacket();
};