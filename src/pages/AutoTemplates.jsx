import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { Car, Copy, Download, CheckCircle2, Search, ChevronDown, ChevronUp, Shield, Cpu, Cog, FlaskConical, Container, Terminal, FileCode2 } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'autosar-bsw',
    title: 'AUTOSAR BSW Module Config',
    desc: 'Basic Software module configuration skeleton for AUTOSAR Classic Platform (CP 4.x). Includes port definitions, runnable mappings, and NvM block descriptors.',
    category: 'AUTOSAR',
    icon: Cog,
    color: 'indigo',
    tags: ['AUTOSAR', 'BSW', 'Classic Platform', 'C'],
    lang: 'C',
    code: `/**
 * AUTOSAR BSW Module Configuration
 * Module: [ModuleName]
 * AUTOSAR Version: 4.4.0
 * 
 * Description: Skeleton for a Basic Software module
 * conforming to AUTOSAR Classic Platform standards.
 */

#ifndef MODULE_NAME_H
#define MODULE_NAME_H

/* ========== Includes ========== */
#include "Std_Types.h"
#include "ComStack_Types.h"
#include "MemMap.h"

/* ========== Version Info ========== */
#define MODULE_VENDOR_ID        (0xFFFFu)
#define MODULE_MODULE_ID        (0x0000u)
#define MODULE_SW_MAJOR_VERSION (1u)
#define MODULE_SW_MINOR_VERSION (0u)
#define MODULE_SW_PATCH_VERSION (0u)

/* ========== Type Definitions ========== */
typedef struct {
    uint16 channelId;
    uint8  priority;
    boolean isEnabled;
} Module_ChannelConfigType;

typedef struct {
    uint8 numChannels;
    const Module_ChannelConfigType* channels;
} Module_ConfigType;

/* ========== Global Variables ========== */
#define MODULE_START_SEC_VAR_INIT_UNSPECIFIED
#include "MemMap.h"

static Module_ConfigType Module_Config;

#define MODULE_STOP_SEC_VAR_INIT_UNSPECIFIED
#include "MemMap.h"

/* ========== Function Declarations ========== */
#define MODULE_START_SEC_CODE
#include "MemMap.h"

void Module_Init(const Module_ConfigType* ConfigPtr);
void Module_DeInit(void);
void Module_MainFunction(void);
Std_ReturnType Module_GetVersionInfo(Std_VersionInfoType* versioninfo);

#define MODULE_STOP_SEC_CODE
#include "MemMap.h"

#endif /* MODULE_NAME_H */

/* ========== Implementation ========== */
void Module_Init(const Module_ConfigType* ConfigPtr)
{
    if (ConfigPtr == NULL_PTR) {
        /* DET Error: MODULE_E_PARAM_POINTER */
        return;
    }
    Module_Config = *ConfigPtr;
    /* Initialize hardware / registers */
}

void Module_DeInit(void)
{
    /* Reset module state */
}

void Module_MainFunction(void)
{
    /* Cyclic processing - called by SchM */
    for (uint8 i = 0u; i < Module_Config.numChannels; i++) {
        if (Module_Config.channels[i].isEnabled) {
            /* Process channel */
        }
    }
}`,
  },
  {
    id: 'cmake-ecu',
    title: 'CMake Cross-Compile for ECU',
    desc: 'CMake toolchain and project setup for cross-compiling embedded C/C++ targeting ARM-based ECUs with safety-critical compiler flags.',
    category: 'Build System',
    icon: Terminal,
    color: 'emerald',
    tags: ['CMake', 'Cross-compile', 'ARM', 'ECU', 'Embedded'],
    lang: 'CMake',
    code: `# =============================================
# CMake Toolchain - ARM Cross-Compile for ECU
# Target: ARM Cortex-R5 / Cortex-M7
# =============================================
cmake_minimum_required(VERSION 3.20)

# -- Toolchain File (ecu_toolchain.cmake) --
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR arm)

set(ARM_TOOLCHAIN_PATH "/opt/arm-gnu-toolchain-12.3/bin")
set(CMAKE_C_COMPILER   "\${ARM_TOOLCHAIN_PATH}/arm-none-eabi-gcc")
set(CMAKE_CXX_COMPILER "\${ARM_TOOLCHAIN_PATH}/arm-none-eabi-g++")
set(CMAKE_ASM_COMPILER "\${ARM_TOOLCHAIN_PATH}/arm-none-eabi-as")
set(CMAKE_OBJCOPY      "\${ARM_TOOLCHAIN_PATH}/arm-none-eabi-objcopy")
set(CMAKE_SIZE         "\${ARM_TOOLCHAIN_PATH}/arm-none-eabi-size")

set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)

# -- Project Definition --
project(ECU_Application
    VERSION 1.0.0
    LANGUAGES C CXX ASM
    DESCRIPTION "ECU firmware application"
)

# Safety-critical compiler flags (MISRA-friendly)
set(SAFETY_FLAGS
    -Wall -Wextra -Werror -Wpedantic
    -Wconversion -Wsign-conversion
    -Wcast-align -Wcast-qual
    -Wfloat-equal -Wshadow
    -Wstrict-prototypes
    -Wmissing-prototypes
    -fno-common
    -ffunction-sections
    -fdata-sections
    -fno-exceptions
    -fno-rtti          # C++ only
    -fstack-usage      # Stack analysis for safety
)

# MCU-specific flags
set(MCU_FLAGS
    -mcpu=cortex-r5
    -mthumb
    -mfloat-abi=hard
    -mfpu=vfpv3-d16
)

# -- Source Files --
file(GLOB_RECURSE SOURCES
    "src/*.c"
    "src/*.cpp"
    "src/startup/*.s"
)

add_executable(\${PROJECT_NAME} \${SOURCES})

target_compile_options(\${PROJECT_NAME} PRIVATE
    \${SAFETY_FLAGS}
    \${MCU_FLAGS}
    $<$<COMPILE_LANGUAGE:C>:-std=c11>
    $<$<COMPILE_LANGUAGE:CXX>:-std=c++17>
)

target_include_directories(\${PROJECT_NAME} PRIVATE
    src/
    src/hal/
    src/bsw/
    src/app/
    config/
)

# Linker configuration
set(LINKER_SCRIPT "\${CMAKE_SOURCE_DIR}/config/ecu_flash.ld")
target_link_options(\${PROJECT_NAME} PRIVATE
    -T\${LINKER_SCRIPT}
    -Wl,--gc-sections
    -Wl,-Map=\${PROJECT_NAME}.map
    --specs=nosys.specs
)

# Generate binary outputs
add_custom_command(TARGET \${PROJECT_NAME} POST_BUILD
    COMMAND \${CMAKE_OBJCOPY} -O ihex $<TARGET_FILE:\${PROJECT_NAME}> \${PROJECT_NAME}.hex
    COMMAND \${CMAKE_OBJCOPY} -O binary $<TARGET_FILE:\${PROJECT_NAME}> \${PROJECT_NAME}.bin
    COMMAND \${CMAKE_SIZE} $<TARGET_FILE:\${PROJECT_NAME}>
    COMMENT "Generating HEX/BIN and size report"
)`,
  },
  {
    id: 'gtest-ecu',
    title: 'Google Test Harness for ECU Code',
    desc: 'Unit test harness using Google Test for testing ECU/embedded code on host, with mocked HAL layer and AUTOSAR stubs.',
    category: 'Testing',
    icon: FlaskConical,
    color: 'violet',
    tags: ['GoogleTest', 'Unit Test', 'Mock', 'AUTOSAR', 'C++'],
    lang: 'C++',
    code: `/**
 * Unit Test Harness for ECU Software Components
 * Framework: Google Test + Google Mock
 * 
 * Tests run on host machine with mocked HAL/BSW layer.
 * Conforms to ISO 26262 unit testing requirements.
 */

#include <gtest/gtest.h>
#include <gmock/gmock.h>

/* ========== Mock HAL Layer ========== */
class MockHAL {
public:
    MOCK_METHOD(uint16_t, ADC_Read, (uint8_t channel));
    MOCK_METHOD(void, GPIO_Write, (uint8_t port, uint8_t pin, bool state));
    MOCK_METHOD(uint32_t, Timer_GetTick, ());
    MOCK_METHOD(int, CAN_Send, (uint32_t id, const uint8_t* data, uint8_t len));
};

/* ========== Mock AUTOSAR RTE ========== */
class MockRte {
public:
    MOCK_METHOD(Std_ReturnType, Rte_Read_SensorValue, (uint16_t* value));
    MOCK_METHOD(Std_ReturnType, Rte_Write_ActuatorCmd, (uint16_t cmd));
    MOCK_METHOD(Std_ReturnType, Rte_Call_NvM_ReadBlock, (uint16_t blockId, void* data));
};

/* Stubs for AUTOSAR standard types (host build) */
#ifndef STD_TYPES_H
typedef uint8_t Std_ReturnType;
#define E_OK     0u
#define E_NOT_OK 1u
#endif

/* Global mock instances (injected via dependency injection) */
static MockHAL* g_mockHal = nullptr;
static MockRte* g_mockRte = nullptr;

/* ========== System Under Test ========== */
extern "C" {
    #include "temperature_monitor.h"  // The SWC being tested
}

/* ========== Test Fixture ========== */
class TemperatureMonitorTest : public ::testing::Test {
protected:
    MockHAL hal;
    MockRte rte;

    void SetUp() override {
        g_mockHal = &hal;
        g_mockRte = &rte;
        TempMon_Init(nullptr);
    }

    void TearDown() override {
        g_mockHal = nullptr;
        g_mockRte = nullptr;
    }
};

/* ========== Test Cases ========== */
TEST_F(TemperatureMonitorTest, NormalTemperature_NoWarning) {
    uint16_t sensorVal = 250u; // 25.0°C
    EXPECT_CALL(rte, Rte_Read_SensorValue(testing::_))
        .WillOnce(testing::DoAll(
            testing::SetArgPointee<0>(sensorVal),
            testing::Return(E_OK)));
    EXPECT_CALL(rte, Rte_Write_ActuatorCmd(0u))
        .WillOnce(testing::Return(E_OK));

    TempMon_MainFunction();

    EXPECT_EQ(TempMon_GetState(), TEMP_STATE_NORMAL);
}

TEST_F(TemperatureMonitorTest, OverTemperature_TriggersShutdown) {
    uint16_t sensorVal = 1200u; // 120.0°C - critical
    EXPECT_CALL(rte, Rte_Read_SensorValue(testing::_))
        .WillOnce(testing::DoAll(
            testing::SetArgPointee<0>(sensorVal),
            testing::Return(E_OK)));
    EXPECT_CALL(rte, Rte_Write_ActuatorCmd(ACTUATOR_SHUTDOWN))
        .WillOnce(testing::Return(E_OK));
    EXPECT_CALL(hal, GPIO_Write(SAFETY_PORT, SAFETY_PIN, true))
        .Times(1);

    TempMon_MainFunction();

    EXPECT_EQ(TempMon_GetState(), TEMP_STATE_CRITICAL);
}

TEST_F(TemperatureMonitorTest, SensorReadFailure_EntersSafeState) {
    EXPECT_CALL(rte, Rte_Read_SensorValue(testing::_))
        .WillOnce(testing::Return(E_NOT_OK));
    EXPECT_CALL(rte, Rte_Write_ActuatorCmd(ACTUATOR_SAFE_STATE))
        .WillOnce(testing::Return(E_OK));

    TempMon_MainFunction();

    EXPECT_EQ(TempMon_GetState(), TEMP_STATE_SAFE);
}

TEST_F(TemperatureMonitorTest, CANDiagnosticFrame_SentPeriodically) {
    uint16_t sensorVal = 400u;
    EXPECT_CALL(rte, Rte_Read_SensorValue(testing::_))
        .WillRepeatedly(testing::DoAll(
            testing::SetArgPointee<0>(sensorVal),
            testing::Return(E_OK)));
    EXPECT_CALL(hal, CAN_Send(DIAG_CAN_ID, testing::_, 8u))
        .Times(1)
        .WillOnce(testing::Return(0));

    // Run 10 cycles to trigger periodic diagnostic
    for (int i = 0; i < 10; i++) {
        TempMon_MainFunction();
    }
}

/* ========== Main ========== */
int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}`,
  },
  {
    id: 'docker-ecu',
    title: 'Docker ECU Build Environment',
    desc: 'Multi-stage Dockerfile for reproducible ECU firmware builds. Includes ARM toolchain, static analysis, and artifact extraction.',
    category: 'CI/CD',
    icon: Container,
    color: 'sky',
    tags: ['Docker', 'CI/CD', 'ARM', 'Build', 'Reproducible'],
    lang: 'Dockerfile',
    code: `# ================================================
# Multi-Stage Docker Build for ECU Firmware
# Reproducible build environment with:
# - ARM GCC Toolchain (cross-compile)
# - Cppcheck & PC-Lint (static analysis)
# - CMake build system
# - Artifact extraction
# ================================================

# Stage 1: Base Build Environment
FROM ubuntu:22.04 AS build-env

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \\
    cmake ninja-build make \\
    gcc-arm-none-eabi \\
    libnewlib-arm-none-eabi \\
    cppcheck \\
    python3 python3-pip \\
    git ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir gcovr lizard

WORKDIR /workspace

# Stage 2: Build Firmware
FROM build-env AS firmware-build

COPY . /workspace/

# Static Analysis
RUN cppcheck \\
    --enable=all \\
    --suppress=missingIncludeSystem \\
    --std=c11 \\
    --platform=arm32-wchar_t2 \\
    --error-exitcode=1 \\
    --xml --xml-version=2 \\
    src/ 2> reports/cppcheck_report.xml || true

# Complexity Analysis
RUN lizard src/ \\
    --CCN 15 \\
    --arguments 6 \\
    --warnings_only \\
    -o reports/complexity_report.html || true

# Build Debug
RUN cmake -B build/debug \\
    -DCMAKE_TOOLCHAIN_FILE=config/ecu_toolchain.cmake \\
    -DCMAKE_BUILD_TYPE=Debug \\
    -G Ninja \\
    && cmake --build build/debug --parallel

# Build Release (optimized, no debug info)
RUN cmake -B build/release \\
    -DCMAKE_TOOLCHAIN_FILE=config/ecu_toolchain.cmake \\
    -DCMAKE_BUILD_TYPE=Release \\
    -DCMAKE_C_FLAGS_RELEASE="-Os -DNDEBUG -flto" \\
    -G Ninja \\
    && cmake --build build/release --parallel

# Stage 3: Extract Artifacts
FROM scratch AS artifacts

COPY --from=firmware-build /workspace/build/release/*.hex /firmware/
COPY --from=firmware-build /workspace/build/release/*.bin /firmware/
COPY --from=firmware-build /workspace/build/release/*.map /firmware/
COPY --from=firmware-build /workspace/reports/ /reports/

# Usage:
# docker build --target artifacts --output type=local,dest=./output .
# => output/firmware/*.hex, output/reports/*.xml`,
  },
  {
    id: 'capl-test',
    title: 'CAPL Test Script (CANoe)',
    desc: 'Vector CANoe CAPL test script for automated CAN bus testing. Includes signal verification, DTC checks, and timing validation.',
    category: 'Testing',
    icon: FlaskConical,
    color: 'violet',
    tags: ['CAPL', 'CANoe', 'CAN', 'Diagnostics', 'Vector'],
    lang: 'CAPL',
    code: `/*
 * CAPL Test Script - CAN Communication Verification
 * Tool: Vector CANoe
 * 
 * Tests: Signal validation, DTC checks, timing, sleep/wake
 * ECU Under Test: Body Controller Module (BCM)
 */

variables {
  /* Test configuration */
  const int TIMEOUT_MS = 2000;
  const int CYCLE_TIME_MS = 100;
  const int TOLERANCE_MS = 10;
  
  /* CAN message IDs */
  const dword BCM_STATUS_ID = 0x320;
  const dword BCM_CMD_ID    = 0x321;
  const dword DIAG_REQ_ID   = 0x7E0;
  const dword DIAG_RSP_ID   = 0x7E8;
  
  /* Counters */
  int msgCount;
  int testsPassed;
  int testsFailed;
  
  msTimer cycleTimer;
  msTimer timeoutTimer;
}

on start {
  testsPassed = 0;
  testsFailed = 0;
  write("========================================");
  write("  BCM CAN Communication Test Suite");
  write("========================================");
}

/* ========== Test Case 1: Cyclic Message Timing ========== */
testcase TC_001_CyclicMessageTiming() {
  message BCM_STATUS_ID msg;
  dword timestamps[20];
  int i;
  
  testCaseTitle("TC_001", "BCM_STATUS cyclic timing verification");
  testCaseDescription("Verify BCM_STATUS is sent every %dms +/- %dms",
                       CYCLE_TIME_MS, TOLERANCE_MS);
  
  msgCount = 0;
  
  /* Collect 20 messages */
  testWaitForMessage(BCM_STATUS_ID, TIMEOUT_MS);
  
  for (i = 0; i < 20; i++) {
    testWaitForMessage(BCM_STATUS_ID, 200);
    timestamps[i] = timeNowNS() / 1000000;
  }
  
  /* Verify timing */
  for (i = 1; i < 20; i++) {
    dword delta = timestamps[i] - timestamps[i-1];
    if (abs(delta - CYCLE_TIME_MS) > TOLERANCE_MS) {
      testStepFail("Cycle %d: Delta=%dms (Expected %d+/-%d)",
                    i, delta, CYCLE_TIME_MS, TOLERANCE_MS);
      return;
    }
  }
  
  testStepPass("All 20 cycles within timing tolerance");
}

/* ========== Test Case 2: Signal Range Validation ========== */
testcase TC_002_SignalRangeCheck() {
  float battVoltage;
  int tempValue;
  
  testCaseTitle("TC_002", "BCM signal range validation");
  
  testWaitForMessage(BCM_STATUS_ID, TIMEOUT_MS);
  
  battVoltage = $BCM_Status::BatteryVoltage;
  tempValue   = $BCM_Status::InternalTemp;
  
  /* Battery voltage: 6V - 16V */
  if (battVoltage >= 6.0 && battVoltage <= 16.0) {
    testStepPass("Battery voltage %.1fV in range [6-16V]", battVoltage);
  } else {
    testStepFail("Battery voltage %.1fV OUT OF RANGE", battVoltage);
  }
  
  /* Internal temp: -40 to 125 */
  if (tempValue >= -40 && tempValue <= 125) {
    testStepPass("Temperature %d°C in range [-40..125]", tempValue);
  } else {
    testStepFail("Temperature %d°C OUT OF RANGE", tempValue);
  }
}

/* ========== Test Case 3: UDS Diagnostic Session ========== */
testcase TC_003_DiagSession() {
  byte diagReq[8];
  byte diagRsp[8];
  
  testCaseTitle("TC_003", "UDS Diagnostic Session Control");
  
  /* Request Extended Diagnostic Session (0x03) */
  diagReq[0] = 0x02;  /* Length */
  diagReq[1] = 0x10;  /* DiagnosticSessionControl */
  diagReq[2] = 0x03;  /* extendedDiagnosticSession */
  
  canSendMessage(DIAG_REQ_ID, diagReq, 8);
  
  if (testWaitForMessage(DIAG_RSP_ID, TIMEOUT_MS) == 1) {
    if (diagRsp[1] == 0x50 && diagRsp[2] == 0x03) {
      testStepPass("Extended session entered successfully");
    } else if (diagRsp[1] == 0x7F) {
      testStepFail("Negative response: NRC=0x%02X", diagRsp[3]);
    }
  } else {
    testStepFail("No diagnostic response within %dms", TIMEOUT_MS);
  }
}

/* ========== Test Case 4: DTC Read & Clear ========== */
testcase TC_004_DTCReadClear() {
  testCaseTitle("TC_004", "Read and clear DTCs");
  
  /* Read DTCs by status mask */
  byte readDTC[8] = {0x03, 0x19, 0x02, 0xFF};
  canSendMessage(DIAG_REQ_ID, readDTC, 8);
  
  if (testWaitForMessage(DIAG_RSP_ID, TIMEOUT_MS)) {
    testStepPass("DTC read response received");
    
    /* Clear all DTCs */
    byte clearDTC[8] = {0x04, 0x14, 0xFF, 0xFF, 0xFF};
    canSendMessage(DIAG_REQ_ID, clearDTC, 8);
    
    if (testWaitForMessage(DIAG_RSP_ID, TIMEOUT_MS)) {
      testStepPass("DTCs cleared successfully");
    }
  }
}

on stopMeasurement {
  write("========================================");
  write("  Results: %d passed, %d failed",
        testsPassed, testsFailed);
  write("========================================");
}`,
  },
  {
    id: 'adaptive-ara',
    title: 'Adaptive AUTOSAR Service (ara::com)',
    desc: 'AUTOSAR Adaptive Platform service skeleton using ara::com for inter-ECU communication. Includes service discovery, proxy, and skeleton patterns.',
    category: 'AUTOSAR',
    icon: Cog,
    color: 'indigo',
    tags: ['AUTOSAR', 'Adaptive', 'ara::com', 'C++17', 'HPC'],
    lang: 'C++',
    code: `/**
 * AUTOSAR Adaptive Platform - Service Implementation
 * API: ara::com (Communication Management)
 * Standard: AUTOSAR AP R22-11
 * 
 * Service: VehicleDynamics 
 * Provides real-time vehicle sensor data to other ECUs
 */

#include <ara/com/service_interface.h>
#include <ara/com/proxy/proxy_base.h>
#include <ara/com/skeleton/skeleton_base.h>
#include <ara/log/logging.h>
#include <ara/exec/execution_client.h>
#include <chrono>
#include <atomic>

namespace vehicle { namespace dynamics {

/* ========= Service Interface Definition ========= */
struct VehicleDynamicsData {
    float speed_kmh;
    float yaw_rate_deg_s;
    float lateral_accel_g;
    float longitudinal_accel_g;
    uint64_t timestamp_us;
};

/* ========= Service Skeleton (Provider Side) ========= */
class VehicleDynamicsSkeleton : public ara::com::skeleton::SkeletonBase {
public:
    // Events (publish to subscribers)
    ara::com::skeleton::Event<VehicleDynamicsData> DynamicsUpdate;
    
    // Methods (request/response)
    ara::com::skeleton::Method<float()> GetCurrentSpeed;
    ara::com::skeleton::Method<bool(float)> SetSpeedLimit;
    
    // Fields (get/set with notification)
    ara::com::skeleton::Field<bool> ESCActive;

    explicit VehicleDynamicsSkeleton(
        ara::com::InstanceIdentifier instance)
        : SkeletonBase(instance)
        , DynamicsUpdate(this)
        , GetCurrentSpeed(this)
        , SetSpeedLimit(this)
        , ESCActive(this)
    {
        GetCurrentSpeed.RegisterHandler(
            [this]() -> float { return currentData_.speed_kmh; });
        
        SetSpeedLimit.RegisterHandler(
            [this](float limit) -> bool {
                if (limit > 0.0f && limit <= 250.0f) {
                    speedLimit_ = limit;
                    ara::log::LogInfo() << "Speed limit set to " << limit;
                    return true;
                }
                return false;
            });
        
        ESCActive.RegisterSetHandler(
            [this](bool active) -> ara::com::Future<bool> {
                escActive_ = active;
                return ara::com::MakeFuture(true);
            });
    }

    void UpdateDynamics(const VehicleDynamicsData& data) {
        currentData_ = data;
        DynamicsUpdate.Send(data);
    }

private:
    VehicleDynamicsData currentData_{};
    float speedLimit_{250.0f};
    std::atomic<bool> escActive_{true};
};

/* ========= Service Proxy (Consumer Side) ========= */
class VehicleDynamicsProxy : public ara::com::proxy::ProxyBase {
public:
    // Subscribe to events
    ara::com::proxy::Event<VehicleDynamicsData> DynamicsUpdate;
    
    // Call remote methods
    ara::com::proxy::Method<float()> GetCurrentSpeed;
    ara::com::proxy::Method<bool(float)> SetSpeedLimit;
    
    // Access remote fields
    ara::com::proxy::Field<bool> ESCActive;

    static ara::com::ServiceHandleContainer<VehicleDynamicsProxy>
    FindService(ara::com::InstanceIdentifier instance) {
        return ara::com::proxy::ProxyBase::FindService(instance);
    }
    
    static ara::com::FindServiceHandle StartFindService(
        ara::com::FindServiceHandler<VehicleDynamicsProxy> handler,
        ara::com::InstanceIdentifier instance) {
        return ara::com::proxy::ProxyBase::StartFindService(handler, instance);
    }
};

}} // namespace vehicle::dynamics

/* ========= Application Entry Point ========= */
int main() {
    // AUTOSAR Adaptive execution management
    ara::exec::ExecutionClient execClient;
    execClient.ReportExecutionState(
        ara::exec::ExecutionState::kRunning);
    
    ara::log::Logger& logger = 
        ara::log::CreateLogger("VD", "Vehicle Dynamics");
    
    // Create and offer the service
    vehicle::dynamics::VehicleDynamicsSkeleton skeleton(
        ara::com::InstanceIdentifier("VehicleDynamics/1"));
    skeleton.OfferService();
    
    logger.LogInfo() << "VehicleDynamics service offered";
    
    // Main processing loop (typically driven by execution manager)
    while (execClient.GetState() == ara::exec::ExecutionState::kRunning) {
        vehicle::dynamics::VehicleDynamicsData data{};
        // Read from sensor HAL...
        data.timestamp_us = std::chrono::duration_cast<
            std::chrono::microseconds>(
                std::chrono::steady_clock::now().time_since_epoch())
            .count();
        
        skeleton.UpdateDynamics(data);
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
    
    skeleton.StopOfferService();
    execClient.ReportExecutionState(
        ara::exec::ExecutionState::kTerminating);
    return 0;
}`,
  },
  {
    id: 'sil-simulation',
    title: 'Software-in-the-Loop (SiL) Test Runner',
    desc: 'Python-based SiL test runner for simulating ECU behavior on host. Integrates with CAN simulation and test reporting.',
    category: 'Testing',
    icon: FlaskConical,
    color: 'violet',
    tags: ['Python', 'SiL', 'Simulation', 'Testing', 'CI/CD'],
    lang: 'Python',
    code: `"""
Software-in-the-Loop (SiL) Test Runner
=======================================
Simulates ECU software on host machine for rapid iteration.
Integrates with virtual CAN bus and generates test reports.

Usage:
    python sil_runner.py --config test_config.yaml --report html
"""

import time
import struct
import logging
import json
from dataclasses import dataclass, field
from typing import Callable
from pathlib import Path
from datetime import datetime

# ========== Virtual CAN Bus ==========
@dataclass
class CANMessage:
    id: int
    data: bytes
    timestamp: float = 0.0
    dlc: int = 8

class VirtualCANBus:
    """Simulates CAN bus for SiL testing without hardware."""
    
    def __init__(self, name: str = "vcan0"):
        self.name = name
        self._subscribers: dict[int, list[Callable]] = {}
        self._tx_log: list[CANMessage] = []
        self._running = True
        logging.info(f"Virtual CAN bus '{name}' initialized")
    
    def subscribe(self, msg_id: int, callback: Callable):
        self._subscribers.setdefault(msg_id, []).append(callback)
    
    def send(self, msg: CANMessage):
        msg.timestamp = time.monotonic()
        self._tx_log.append(msg)
        for cb in self._subscribers.get(msg.id, []):
            cb(msg)
    
    def get_tx_log(self) -> list[CANMessage]:
        return self._tx_log.copy()

# ========== ECU Simulation Wrapper ==========
class ECUSimulation:
    """Wraps compiled ECU code (shared lib) for host execution."""
    
    def __init__(self, ecu_name: str, can_bus: VirtualCANBus):
        self.ecu_name = ecu_name
        self.can_bus = can_bus
        self.cycle_time_ms = 10
        self.state = {}
        self._init_signals()
    
    def _init_signals(self):
        self.state = {
            "vehicle_speed": 0.0,
            "engine_rpm": 0,
            "coolant_temp": 25.0,
            "battery_voltage": 12.6,
            "ignition_state": "OFF",
        }
    
    def set_input(self, signal: str, value):
        self.state[signal] = value
    
    def get_output(self, signal: str):
        return self.state.get(signal)
    
    def step(self):
        """Execute one cycle of the ECU software."""
        # Pack status into CAN frame
        speed = struct.pack('<f', self.state["vehicle_speed"])
        rpm = struct.pack('<H', self.state["engine_rpm"])
        temp = struct.pack('<b', int(self.state["coolant_temp"]))
        batt = struct.pack('<B', int(self.state["battery_voltage"] * 10))
        
        msg = CANMessage(
            id=0x320,
            data=speed + rpm + temp + batt,
        )
        self.can_bus.send(msg)

# ========== Test Framework ==========
@dataclass
class TestResult:
    name: str
    passed: bool
    duration_ms: float
    details: str = ""

@dataclass
class TestSuite:
    name: str
    results: list[TestResult] = field(default_factory=list)
    
    @property
    def pass_count(self):
        return sum(1 for r in self.results if r.passed)

class SiLTestRunner:
    def __init__(self):
        self.can_bus = VirtualCANBus("vcan_sil")
        self.ecu = ECUSimulation("BCM", self.can_bus)
        self.suite = TestSuite("BCM SiL Tests")
    
    def run_test(self, name: str, test_fn: Callable):
        start = time.monotonic()
        try:
            test_fn(self.ecu, self.can_bus)
            duration = (time.monotonic() - start) * 1000
            self.suite.results.append(
                TestResult(name, True, duration, "PASS"))
            logging.info(f"  PASS: {name} ({duration:.1f}ms)")
        except AssertionError as e:
            duration = (time.monotonic() - start) * 1000
            self.suite.results.append(
                TestResult(name, False, duration, str(e)))
            logging.error(f"  FAIL: {name} - {e}")
    
    def generate_report(self, output_dir: str = "reports"):
        Path(output_dir).mkdir(exist_ok=True)
        report = {
            "suite": self.suite.name,
            "timestamp": datetime.now().isoformat(),
            "total": len(self.suite.results),
            "passed": self.suite.pass_count,
            "failed": len(self.suite.results) - self.suite.pass_count,
            "tests": [
                {"name": r.name, "passed": r.passed,
                 "duration_ms": r.duration_ms, "details": r.details}
                for r in self.suite.results
            ],
        }
        report_path = Path(output_dir) / "sil_report.json"
        report_path.write_text(json.dumps(report, indent=2))
        logging.info(f"Report saved to {report_path}")

# ========== Test Cases ==========
def test_ignition_on_sequence(ecu: ECUSimulation, can: VirtualCANBus):
    ecu.set_input("ignition_state", "ON")
    ecu.set_input("battery_voltage", 12.6)
    for _ in range(10):
        ecu.step()
    assert ecu.get_output("ignition_state") == "ON"
    tx = can.get_tx_log()
    assert len(tx) >= 10, f"Expected >=10 CAN frames, got {len(tx)}"

def test_low_battery_warning(ecu: ECUSimulation, can: VirtualCANBus):
    ecu.set_input("battery_voltage", 9.5)
    ecu.set_input("ignition_state", "ON")
    for _ in range(50):
        ecu.step()
    # In real impl, check warning signal in CAN output
    assert ecu.get_output("battery_voltage") == 9.5

def test_speed_signal_encoding(ecu: ECUSimulation, can: VirtualCANBus):
    ecu.set_input("vehicle_speed", 120.5)
    ecu.step()
    tx = can.get_tx_log()
    last_msg = tx[-1]
    decoded_speed = struct.unpack('<f', last_msg.data[:4])[0]
    assert abs(decoded_speed - 120.5) < 0.01

# ========== Main ==========
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO,
                       format="%(asctime)s %(levelname)s %(message)s")
    runner = SiLTestRunner()
    runner.run_test("TC_001_IgnitionSequence", test_ignition_on_sequence)
    runner.run_test("TC_002_LowBatteryWarning", test_low_battery_warning)
    runner.run_test("TC_003_SpeedEncoding", test_speed_signal_encoding)
    runner.generate_report()`,
  },
  {
    id: 'safety-req',
    title: 'ISO 26262 Safety Requirements Template',
    desc: 'Structured safety requirements document template following ISO 26262 format. ASIL decomposition, safety goals, FSR/TSR traceability.',
    category: 'Documentation',
    icon: Shield,
    color: 'rose',
    tags: ['ISO 26262', 'Safety', 'ASIL', 'Requirements', 'FMEA'],
    lang: 'Markdown',
    code: `# Safety Requirements Specification
## Project: [ECU Name] - [Function Name]
## Document ID: SRS-[XXX]-[Rev]
## ASIL Classification: [ASIL B/C/D]

---

## 1. Safety Goals (SG)

| ID | Safety Goal | ASIL | Safe State | FTTI |
|----|-------------|------|------------|------|
| SG-001 | Prevent unintended acceleration | ASIL D | Engine torque = 0 | 100ms |
| SG-002 | Ensure braking upon request | ASIL D | Apply max brake | 50ms |
| SG-003 | Prevent incorrect steering assist | ASIL C | Disable EPS motor | 200ms |

## 2. Functional Safety Requirements (FSR)

### FSR-001: Torque Monitoring
- **Derived from:** SG-001
- **ASIL:** D
- **Description:** The system shall continuously monitor the requested 
  vs actual torque output with a tolerance of ±5%.
- **Failure Detection Time:** < 50ms
- **Safe State Transition Time:** < 100ms
- **Verification Method:** SiL + HiL Testing, Code Review

### FSR-002: Redundant Sensor Plausibility
- **Derived from:** SG-001, SG-002
- **ASIL:** D (decomposed: ASIL B(D) + ASIL B(D))
- **Description:** Two independent sensor channels shall be compared.
  If deviation exceeds threshold for > 3 consecutive cycles,
  trigger safe state.
- **Threshold:** 10% of full scale
- **Verification Method:** Fault Injection Testing

### FSR-003: Watchdog Supervision
- **Derived from:** SG-001, SG-002, SG-003
- **ASIL:** D
- **Description:** An independent hardware watchdog shall monitor
  the main application task. Failure to service within deadline
  shall trigger MCU reset and safe state.
- **Deadline:** Configurable, default 10ms
- **Verification Method:** HiL Fault Injection

## 3. Technical Safety Requirements (TSR)

### TSR-001: ADC Diagnostic
- **Derived from:** FSR-002
- **Description:** ADC module shall perform self-test at startup
  and periodic runtime checks (every 100ms).
- **Acceptance Criteria:** 
  - Reference voltage within ±2%
  - Conversion time < 10µs

### TSR-002: CRC Protection
- **Derived from:** FSR-001
- **Description:** All safety-critical CAN messages shall include
  E2E CRC-8 protection per AUTOSAR E2E Profile 1.
- **Alive Counter:** 4-bit, increment per cycle

### TSR-003: Memory Protection (MPU)
- **Derived from:** FSR-003
- **Description:** Safety-critical data regions shall be protected
  by MPU. Non-safety tasks shall not access safety memory.
- **Regions:** Min 4 protected regions

## 4. ASIL Decomposition

\`\`\`
SG-001 (ASIL D)
├── FSR-001 (ASIL D) → No decomposition
├── FSR-002 (ASIL D) → Decomposed:
│   ├── Sensor Channel A: ASIL B(D)
│   └── Sensor Channel B: ASIL B(D)
└── FSR-003 (ASIL D) → Independent path
    ├── Software Watchdog: ASIL B(D)
    └── Hardware Watchdog: ASIL B(D)
\`\`\`

## 5. Traceability Matrix

| Safety Goal | FSR | TSR | Test Case | Status |
|-------------|-----|-----|-----------|--------|
| SG-001 | FSR-001 | TSR-001, TSR-002 | TC-101, TC-102 | ✅ |
| SG-001 | FSR-002 | TSR-001 | TC-201, TC-202 | ✅ |
| SG-002 | FSR-002 | TSR-001 | TC-201 | ⏳ |
| SG-003 | FSR-003 | TSR-003 | TC-301, TC-302 | ✅ |

## 6. Verification Summary

- [ ] Code Review per MISRA C:2012
- [ ] Unit Testing (100% MC/DC for ASIL D)
- [ ] SiL Testing
- [ ] HiL Testing  
- [ ] Fault Injection Testing
- [ ] Back-to-back Testing (MiL vs SiL vs HiL)
- [ ] Safety Analysis Review (FMEA/FTA)`,
  },
  {
    id: 'someip-service',
    title: 'SOME/IP Service Discovery',
    desc: 'vsomeip-based service implementation for Ethernet-connected ECUs. Includes service offering, event subscription, and method handlers.',
    category: 'Communication',
    icon: Cpu,
    color: 'cyan',
    tags: ['SOME/IP', 'vsomeip', 'Ethernet', 'Service Discovery', 'C++'],
    lang: 'C++',
    code: `/**
 * SOME/IP Service Implementation using vsomeip
 * For Ethernet-based ECU communication
 * 
 * Service: DiagnosticService (0x1234)
 * - Method: ReadDTC (0x0001)
 * - Event: DTCStatusChanged (0x8001)
 * - Eventgroup: DiagEvents (0x0001)
 */

#include <vsomeip/vsomeip.hpp>
#include <iostream>
#include <memory>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <vector>
#include <cstring>

// Service identifiers
constexpr vsomeip::service_t  DIAG_SERVICE_ID  = 0x1234;
constexpr vsomeip::instance_t DIAG_INSTANCE_ID = 0x0001;
constexpr vsomeip::method_t   READ_DTC_METHOD  = 0x0001;
constexpr vsomeip::method_t   CLEAR_DTC_METHOD = 0x0002;
constexpr vsomeip::event_t    DTC_CHANGED_EVT  = 0x8001;
constexpr vsomeip::eventgroup_t DIAG_EVT_GROUP = 0x0001;

// ========== Service Provider ==========
class DiagServiceProvider {
public:
    DiagServiceProvider()
        : app_(vsomeip::runtime::get()->create_application("DiagProvider"))
    {}

    bool init() {
        if (!app_->init()) {
            std::cerr << "Failed to init vsomeip application" << std::endl;
            return false;
        }

        // Register message handler for ReadDTC method
        app_->register_message_handler(
            DIAG_SERVICE_ID, DIAG_INSTANCE_ID, READ_DTC_METHOD,
            [this](const std::shared_ptr<vsomeip::message>& msg) {
                on_read_dtc(msg);
            });

        // Register message handler for ClearDTC method
        app_->register_message_handler(
            DIAG_SERVICE_ID, DIAG_INSTANCE_ID, CLEAR_DTC_METHOD,
            [this](const std::shared_ptr<vsomeip::message>& msg) {
                on_clear_dtc(msg);
            });

        // Register availability callback
        app_->register_state_handler(
            [this](vsomeip::state_type_e state) {
                if (state == vsomeip::state_type_e::ST_REGISTERED) {
                    // Offer service when registered
                    app_->offer_service(DIAG_SERVICE_ID, DIAG_INSTANCE_ID);

                    // Offer event
                    std::set<vsomeip::eventgroup_t> groups;
                    groups.insert(DIAG_EVT_GROUP);
                    app_->offer_event(
                        DIAG_SERVICE_ID, DIAG_INSTANCE_ID,
                        DTC_CHANGED_EVT, groups,
                        vsomeip::event_type_e::ET_EVENT);

                    std::cout << "Service offered: 0x"
                              << std::hex << DIAG_SERVICE_ID << std::endl;
                }
            });

        return true;
    }

    void start() {
        app_->start();
    }

    void notify_dtc_change(uint32_t dtc_id, uint8_t status) {
        auto payload = vsomeip::runtime::get()->create_payload();
        std::vector<vsomeip::byte_t> data(5);
        std::memcpy(data.data(), &dtc_id, 4);
        data[4] = status;
        payload->set_data(data);
        app_->notify(DIAG_SERVICE_ID, DIAG_INSTANCE_ID,
                     DTC_CHANGED_EVT, payload);
    }

private:
    void on_read_dtc(const std::shared_ptr<vsomeip::message>& msg) {
        // Build response
        auto response = vsomeip::runtime::get()->create_response(msg);
        auto payload = vsomeip::runtime::get()->create_payload();

        // Example: return 2 DTCs
        std::vector<vsomeip::byte_t> dtc_data = {
            0x00, 0x01, 0x23, 0x01,  // DTC 0x000123, status=active
            0x00, 0x04, 0x56, 0x00,  // DTC 0x000456, status=stored
        };
        payload->set_data(dtc_data);
        response->set_payload(payload);
        app_->send(response);
    }

    void on_clear_dtc(const std::shared_ptr<vsomeip::message>& msg) {
        auto response = vsomeip::runtime::get()->create_response(msg);
        auto payload = vsomeip::runtime::get()->create_payload();
        std::vector<vsomeip::byte_t> result = { 0x00 }; // success
        payload->set_data(result);
        response->set_payload(payload);
        app_->send(response);
        std::cout << "DTCs cleared" << std::endl;
    }

    std::shared_ptr<vsomeip::application> app_;
};

// ========== Service Consumer ==========
class DiagServiceConsumer {
public:
    DiagServiceConsumer()
        : app_(vsomeip::runtime::get()->create_application("DiagConsumer"))
    {}

    bool init() {
        if (!app_->init()) return false;

        app_->register_availability_handler(
            DIAG_SERVICE_ID, DIAG_INSTANCE_ID,
            [this](vsomeip::service_t, vsomeip::instance_t, bool avail) {
                std::cout << "Service " << (avail ? "available" : "unavailable")
                          << std::endl;
                if (avail) service_available_ = true;
            });

        app_->register_message_handler(
            DIAG_SERVICE_ID, DIAG_INSTANCE_ID, READ_DTC_METHOD,
            [](const std::shared_ptr<vsomeip::message>& msg) {
                auto payload = msg->get_payload();
                std::cout << "Received " << payload->get_length()
                          << " bytes of DTC data" << std::endl;
            });

        // Subscribe to DTC change events
        app_->register_message_handler(
            DIAG_SERVICE_ID, DIAG_INSTANCE_ID, DTC_CHANGED_EVT,
            [](const std::shared_ptr<vsomeip::message>& msg) {
                std::cout << "DTC status changed notification" << std::endl;
            });

        app_->request_service(DIAG_SERVICE_ID, DIAG_INSTANCE_ID);
        
        std::set<vsomeip::eventgroup_t> groups;
        groups.insert(DIAG_EVT_GROUP);
        app_->subscribe(DIAG_SERVICE_ID, DIAG_INSTANCE_ID, DIAG_EVT_GROUP);

        return true;
    }

    void request_dtcs() {
        auto request = vsomeip::runtime::get()->create_request();
        request->set_service(DIAG_SERVICE_ID);
        request->set_instance(DIAG_INSTANCE_ID);
        request->set_method(READ_DTC_METHOD);
        app_->send(request);
    }

    void start() { app_->start(); }

private:
    std::shared_ptr<vsomeip::application> app_;
    bool service_available_ = false;
};

int main(int argc, char** argv) {
    if (argc > 1 && std::string(argv[1]) == "--consumer") {
        DiagServiceConsumer consumer;
        if (consumer.init()) consumer.start();
    } else {
        DiagServiceProvider provider;
        if (provider.init()) provider.start();
    }
    return 0;
}`,
  },
];

const CATEGORIES = [...new Set(TEMPLATES.map(t => t.category))];

const COLOR_MAP = {
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800', badge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800', badge: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' },
};

export default function AutoTemplates() {
  const { onMenuClick } = useOutletContext();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const filtered = TEMPLATES.filter(t => {
    const matchCat = selectedCat === 'All' || t.category === selectedCat;
    const q = search.toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const copyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadCode = (t) => {
    const ext = { C: 'c', 'C++': 'cpp', CMake: 'cmake', Dockerfile: 'dockerfile', CAPL: 'can', Python: 'py', Markdown: 'md' };
    const blob = new Blob([t.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.id}.${ext[t.lang] || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header title="Automotive Templates" subtitle="Industry-standard code templates for ECU & AUTOSAR development" onMenuClick={onMenuClick} />
      <div className="p-6 space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates (e.g. AUTOSAR, docker, CAPL, MISRA...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedCat === cat
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {filtered.length} templates</span>
          <span className="flex items-center gap-1"><FileCode2 className="w-3.5 h-3.5" /> {CATEGORIES.length} categories</span>
        </div>

        {/* Template Cards */}
        <div className="space-y-4">
          {filtered.map(t => {
            const c = COLOR_MAP[t.color] || COLOR_MAP.indigo;
            const Icon = t.icon;
            const isExpanded = expandedId === t.id;
            return (
              <div key={t.id} className={`bg-white dark:bg-slate-800 rounded-2xl border ${isExpanded ? c.border : 'border-gray-200 dark:border-slate-700'} transition-all overflow-hidden shadow-sm hover:shadow-md`}>
                {/* Header */}
                <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>{t.category}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{t.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {t.tags.map(tag => (
                          <span key={tag} className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-medium">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-2 py-1 rounded">{t.lang}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Code */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between px-5 py-2 bg-gray-50 dark:bg-slate-900/50">
                      <span className="text-[10px] font-mono text-gray-400">{t.code.split('\n').length} lines</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); copyCode(t.id, t.code); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          {copiedId === t.id ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); downloadCode(t); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    </div>
                    <pre className="p-5 text-xs font-mono text-gray-700 dark:text-slate-300 overflow-x-auto max-h-[500px] overflow-y-auto bg-gray-50/50 dark:bg-slate-900/30 leading-relaxed">
                      {t.code}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Car className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">No templates match your search</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Try different keywords or clear filters</p>
          </div>
        )}
      </div>
    </>
  );
}
