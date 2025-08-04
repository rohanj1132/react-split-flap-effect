/* eslint-env jest */
import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import {
  FlapDisplayProvider,
  useFlapDisplayScheduler,
} from "./FlapDisplayProvider";

describe("<FlapDisplayProvider/>", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");
    jest.spyOn(global, "clearTimeout");
    jest.spyOn(Date, "now");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe("useFlapDisplayScheduler hook", () => {
    it("returns no-op scheduler when used outside provider", () => {
      const { result } = renderHook(() => useFlapDisplayScheduler());

      expect(result.current.getDigitStartDelay()).toBe(0);
      expect(result.current.batchSize).toBe(Infinity);
      expect(result.current.batchDelayMs).toBe(0);
    });

    it("returns scheduler with default values when used with provider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider>{children}</FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      expect(result.current.batchSize).toBe(50);
      expect(result.current.batchDelayMs).toBe(16);
      expect(typeof result.current.getDigitStartDelay).toBe("function");
    });

    it("returns scheduler with custom values when provided", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider batchSize={10} batchDelayMs={32}>
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      expect(result.current.batchSize).toBe(10);
      expect(result.current.batchDelayMs).toBe(32);
    });
  });

  describe("getDigitStartDelay function", () => {
    it("returns 0 delay for first digit", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider>{children}</FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      const delay = result.current.getDigitStartDelay();
      expect(delay).toBe(0);
    });

    it("returns 0 delay for digits within first batch", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider batchSize={3} batchDelayMs={100}>
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // First 3 digits should have 0 delay
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 0
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 1
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 2
    });

    it("returns correct delay for digits in subsequent batches", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider batchSize={2} batchDelayMs={100}>
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // First batch (0 delay)
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 0
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 1

      // Second batch (100ms delay)
      expect(result.current.getDigitStartDelay()).toBe(100); // digit 2
      expect(result.current.getDigitStartDelay()).toBe(100); // digit 3

      // Third batch (200ms delay)
      expect(result.current.getDigitStartDelay()).toBe(200); // digit 4
    });

    it("increments digit counter with each call", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider batchSize={1} batchDelayMs={50}>
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // Each digit should have increasing delay
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 0
      expect(result.current.getDigitStartDelay()).toBe(50); // digit 1
      expect(result.current.getDigitStartDelay()).toBe(100); // digit 2
      expect(result.current.getDigitStartDelay()).toBe(150); // digit 3
    });
  });

  describe("reset functionality", () => {
    it("schedules reset timer after each getDigitStartDelay call", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider resetAfterMs={1000}>
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      result.current.getDigitStartDelay();

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it("clears previous reset timer when getDigitStartDelay is called again", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider resetAfterMs={1000}>
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // First call
      result.current.getDigitStartDelay();
      const firstTimerId = (setTimeout as unknown as jest.Mock).mock.results[0]
        .value;

      // Second call should clear the first timer
      result.current.getDigitStartDelay();

      expect(clearTimeout).toHaveBeenCalledWith(firstTimerId);
    });

    it("resets counter after inactivity period", () => {
      let currentTime = 0;
      (Date.now as jest.Mock).mockImplementation(() => currentTime);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider
          batchSize={2}
          batchDelayMs={100}
          resetAfterMs={500}
        >
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // Get delays for first batch
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 0
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 1
      expect(result.current.getDigitStartDelay()).toBe(100); // digit 2

      // Simulate time passing beyond reset threshold
      currentTime = 600;

      // Should reset and start from 0 again
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 0 (reset)
    });

    it("does not reset if activity continues within reset period", () => {
      let currentTime = 0;
      (Date.now as jest.Mock).mockImplementation(() => currentTime);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider
          batchSize={2}
          batchDelayMs={100}
          resetAfterMs={500}
        >
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // Get delays with activity
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 0

      currentTime = 200; // Still within reset period
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 1

      currentTime = 400; // Still within reset period
      expect(result.current.getDigitStartDelay()).toBe(100); // digit 2 (second batch)
    });

    it("resets counter when timer expires", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider
          batchSize={1}
          batchDelayMs={100}
          resetAfterMs={500}
        >
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // Get some delays
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 0
      expect(result.current.getDigitStartDelay()).toBe(100); // digit 1
      expect(result.current.getDigitStartDelay()).toBe(200); // digit 2

      // Run the reset timer
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Next call should start from 0 again
      expect(result.current.getDigitStartDelay()).toBe(0); // digit 0 (reset)
    });
  });

  describe("cleanup", () => {
    it("clears reset timer on unmount", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider resetAfterMs={1000}>
          {children}
        </FlapDisplayProvider>
      );

      const { result, unmount } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // Trigger a timer
      result.current.getDigitStartDelay();
      const timerId = (setTimeout as unknown as jest.Mock).mock.results[0]
        .value;

      // Unmount
      unmount();

      // Timer should be cleared
      expect(clearTimeout).toHaveBeenCalledWith(timerId);
    });

    it("handles unmount when no timer is active", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider>{children}</FlapDisplayProvider>
      );

      const { unmount } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // Unmount without calling getDigitStartDelay
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("handles batchSize of 1 correctly", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider batchSize={1} batchDelayMs={50}>
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // Each digit should be in its own batch
      expect(result.current.getDigitStartDelay()).toBe(0); // batch 0
      expect(result.current.getDigitStartDelay()).toBe(50); // batch 1
      expect(result.current.getDigitStartDelay()).toBe(100); // batch 2
    });

    it("handles very large batchSize", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider batchSize={1000} batchDelayMs={100}>
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // First 1000 digits should all have 0 delay
      for (let i = 0; i < 1000; i++) {
        expect(result.current.getDigitStartDelay()).toBe(0);
      }

      // 1001st digit should have delay
      expect(result.current.getDigitStartDelay()).toBe(100);
    });

    it("handles zero batchDelayMs", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FlapDisplayProvider batchSize={2} batchDelayMs={0}>
          {children}
        </FlapDisplayProvider>
      );

      const { result } = renderHook(() => useFlapDisplayScheduler(), {
        wrapper,
      });

      // All digits should have 0 delay regardless of batch
      expect(result.current.getDigitStartDelay()).toBe(0);
      expect(result.current.getDigitStartDelay()).toBe(0);
      expect(result.current.getDigitStartDelay()).toBe(0);
      expect(result.current.getDigitStartDelay()).toBe(0);
    });
  });
});
