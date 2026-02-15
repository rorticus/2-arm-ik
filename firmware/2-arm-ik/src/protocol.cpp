#include "Serial.h"
#include "protocol.h"

#define SERIAL_BUFFER_SIZE 32

unsigned char serialBuffer[SERIAL_BUFFER_SIZE];
unsigned char serialBufferStart = 0;
unsigned char serialBufferEnd = 0;

void Protocol::attach() {
    Serial.begin(9600);
}

void Protocol::update() {
    while (Serial.available() > 0) {
        serialBuffer[serialBufferEnd] = Serial.read();
        serialBufferEnd = (serialBufferEnd + 1) % SERIAL_BUFFER_SIZE;
    }
}

SerialPacket* Protocol::nextPacket() {
    static SerialPacket packet;

    size_t available = (serialBufferEnd - serialBufferStart + SERIAL_BUFFER_SIZE) % SERIAL_BUFFER_SIZE;
    
    if (available >= sizeof(SerialPacket)) {
        uint8_t* raw = reinterpret_cast<uint8_t*>(&packet);
        for (size_t i = 0; i < sizeof(SerialPacket); i++) {
            raw[i] = serialBuffer[serialBufferStart];
            serialBufferStart = (serialBufferStart + 1) % SERIAL_BUFFER_SIZE;
        }
        return &packet;
    }
    
    return nullptr;
}