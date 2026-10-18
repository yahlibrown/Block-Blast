// The browser side of the device facts: reads the real globals and hands them to
// the pure `deviceFacts`. Call again whenever they may have changed (e.g. on resize).
import { deviceFacts, type DeviceFacts, type DeviceInputs } from "../device/deviceFacts";

export function readDeviceInputs(): DeviceInputs {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const displayStandalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const viewport = window.visualViewport;
  return {
    navigator,
    standalone: iosStandalone || displayStandalone,
    touchFirst: window.matchMedia?.("(pointer: coarse)").matches ?? false,
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  };
}

export function readDeviceFacts(): DeviceFacts {
  return deviceFacts(readDeviceInputs());
}
