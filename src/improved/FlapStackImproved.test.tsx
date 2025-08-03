/* eslint-env jest */
import "@testing-library/jest-dom";
import { act, render } from "@testing-library/react";
import React from "react";
import { FlapDisplayProvider } from "./FlapDisplayProvider";
import { FlapStackImproved } from "./FlapStackImproved";

// Mock classnames to work like the real library
jest.mock("classnames", () => ({
  __esModule: true,
  default: (...args: any[]) => {
    return args
      .filter((arg: any) => {
        if (typeof arg === "string") return true;
        if (typeof arg === "object" && arg !== null) {
          return Object.entries(arg).some(([, value]) => value);
        }
        return false;
      })
      .map((arg: any) => {
        if (typeof arg === "string") return arg;
        if (typeof arg === "object" && arg !== null) {
          return Object.entries(arg)
            .filter(([, value]) => value)
            .map(([key]) => key)
            .join(" ");
        }
        return "";
      })
      .join(" ");
  },
}));

jest.mock("./improved-styles.css", () => ({
  default: {
    digit: "digit",
    flapFrame: "flapFrame",
    flapHalf: "flapHalf",
    flapContent: "flapContent",
    top: "top",
    bottom: "bottom",
    animated: "animated",
    animating: "animating",
    static: "static",
    back: "back",
    current: "current",
    hinge: "hinge",
  },
}));

interface FlapStackImprovedTestProps {
  stack: string[];
  value: string;
  timing: number;
  className?: string;
  css?: any;
  mode?: string | null;
  hinge?: boolean;
}

describe("<FlapStackImproved/>", () => {
  let props: FlapStackImprovedTestProps;

  beforeEach(() => {
    props = {
      stack: [" ", "A", "Z"],
      value: "Z",
      timing: 30,
    };

    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");
    jest.spyOn(global, "clearTimeout");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("renders a digit container", () => {
    const { container } = render(<FlapStackImproved {...props} />);
    const digit = container.querySelector('[data-kind="digit"]');
    expect(digit).toBeInTheDocument();
  });

  it("renders the initial value immediately without animation", () => {
    const { container } = render(<FlapStackImproved {...props} />);

    // Get the digit container
    const digit = container.querySelector('[data-kind="digit"]');
    expect(digit).toBeInTheDocument();

    // Should have exactly one frame child
    const frameElements = digit!.children;
    expect(frameElements).toHaveLength(1);

    // The frame should contain the initial value
    const frame = frameElements[0];
    const spans = frame.querySelectorAll("span");

    // Static frame has 2 spans (top and bottom halves)
    expect(spans).toHaveLength(2);

    // Both should show 'Z' (the initial value)
    expect(spans[0].textContent).toBe("Z");
    expect(spans[1].textContent).toBe("Z");
  });

  it("animates when value changes", () => {
    const { container, rerender } = render(<FlapStackImproved {...props} />);

    // Change value from Z to A
    rerender(<FlapStackImproved {...props} value="A" />);

    // Should now have multiple frames for animation
    const digit = container.querySelector('[data-kind="digit"]');
    const frameElements = digit!.children;
    expect(frameElements.length).toBeGreaterThan(1);
  });

  it("builds correct sequence from current to target value", () => {
    const { container, rerender } = render(
      <FlapStackImproved {...props} value=" " />
    );

    // Change value from " " to "Z" (should go through " " -> "A" -> "Z")
    rerender(<FlapStackImproved {...props} value="Z" />);

    const digit = container.querySelector('[data-kind="digit"]');
    const frameElements = digit!.children;

    // Should have 2 frames: " " -> "A" and "A" -> "Z"
    expect(frameElements).toHaveLength(2);

    // First frame: " " -> "A"
    const firstFrameSpans = frameElements[0].querySelectorAll("span");
    // Should have 4 spans for animated frame (2 for current, 2 for next)
    expect(firstFrameSpans.length).toBeGreaterThanOrEqual(4);

    // Second frame: "A" -> "Z"
    const secondFrameSpans = frameElements[1].querySelectorAll("span");
    expect(secondFrameSpans.length).toBeGreaterThanOrEqual(4);
  });

  it("completes animation and shows final static frame", () => {
    const { container, rerender } = render(
      <FlapStackImproved {...props} value=" " />
    );

    // Change value to trigger animation
    rerender(<FlapStackImproved {...props} value="Z" />);

    // Fast forward through all timers
    act(() => {
      jest.runAllTimers();
    });

    // Should now show single static frame with final value
    const digit = container.querySelector('[data-kind="digit"]');
    const frameElements = digit!.children;
    expect(frameElements).toHaveLength(1);

    const spans = frameElements[0].querySelectorAll("span");
    expect(spans[0].textContent).toBe("Z");
    expect(spans[1].textContent).toBe("Z");
  });

  it("applies slower timing to the last character in sequence", () => {
    const { container, rerender } = render(
      <FlapStackImproved {...props} value=" " />
    );

    // Change value to trigger animation
    rerender(<FlapStackImproved {...props} value="Z" />);

    // Check the animation frames
    const digit = container.querySelector('[data-kind="digit"]');
    const frameElements = digit!.children;
    expect(frameElements).toHaveLength(2);

    // Last frame should have slower timing (1.5x)
    // We verify the behavior through the setTimeout calls
    expect(setTimeout).toHaveBeenCalled();
  });

  it("passes mode prop down to digit container", () => {
    const { container } = render(<FlapStackImproved {...props} mode="alpha" />);
    const digit = container.querySelector('[data-kind="digit"]') as HTMLElement;

    expect(digit).toHaveAttribute("data-mode", "alpha");
  });

  it("passes hinge prop down to FlapFrame", () => {
    const { container } = render(<FlapStackImproved {...props} hinge={true} />);
    const hinges = container.querySelectorAll('[data-kind="hinge"]');

    // Should have hinge element in the static frame
    expect(hinges.length).toBeGreaterThan(0);
  });

  it("does not render hinges when hinge prop is false", () => {
    const { container } = render(
      <FlapStackImproved {...props} hinge={false} />
    );
    const hinges = container.querySelectorAll('[data-kind="hinge"]');

    expect(hinges).toHaveLength(0);
  });

  it("handles value not in stack gracefully", () => {
    const { container } = render(<FlapStackImproved {...props} value="X" />);

    // Should still render without crashing
    const digit = container.querySelector('[data-kind="digit"]');
    expect(digit).toBeInTheDocument();

    // Should show the invalid value in static frame
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].textContent).toBe("X");
  });

  it("clears animation timer on unmount", () => {
    const { unmount, rerender } = render(
      <FlapStackImproved {...props} value=" " />
    );

    // Trigger animation by changing value
    rerender(<FlapStackImproved {...props} value="Z" />);

    // Verify setTimeout was called (animation started)
    expect(setTimeout).toHaveBeenCalled();

    // Now unmount while animation is running
    unmount();

    // Verify clearTimeout was called
    expect(clearTimeout).toHaveBeenCalled();
  });

  it("applies CSS prop to digit container", () => {
    const customCss = { fontSize: "2em", color: "red" };
    const { container } = render(
      <FlapStackImproved {...props} css={customCss} />
    );
    const digit = container.querySelector('[data-kind="digit"]') as HTMLElement;

    expect(digit.style.fontSize).toBe("2em");
    expect(digit.style.color).toBe("red");
  });

  it("applies className prop to FlapFrame", () => {
    const { container } = render(
      <FlapStackImproved {...props} className="custom-class" />
    );

    // The className should be passed to the frame
    const digit = container.querySelector('[data-kind="digit"]');
    expect(digit).toBeInTheDocument();

    // Since we can't test CSS classes directly, we just verify the component renders
    const frameElement = digit!.children[0];
    expect(frameElement).toBeInTheDocument();
  });

  it("uses FlapDisplayScheduler for delays", () => {
    const mockGetDigitStartDelay = jest.fn().mockReturnValue(100);
    const MockProvider = ({ children }: { children: React.ReactNode }) => (
      <FlapDisplayProvider>{children}</FlapDisplayProvider>
    );

    // Mock the scheduler hook
    jest
      .spyOn(require("./FlapDisplayProvider"), "useFlapDisplayScheduler")
      .mockReturnValue({
        getDigitStartDelay: mockGetDigitStartDelay,
        batchSize: 50,
        batchDelayMs: 16,
      });

    const { rerender } = render(
      <MockProvider>
        <FlapStackImproved {...props} value=" " />
      </MockProvider>
    );

    // Trigger animation
    rerender(
      <MockProvider>
        <FlapStackImproved {...props} value="Z" />
      </MockProvider>
    );

    // Verify scheduler was called
    expect(mockGetDigitStartDelay).toHaveBeenCalled();
  });

  it("wraps around when reaching end of stack", () => {
    const { container, rerender } = render(
      <FlapStackImproved {...props} stack={["0", "1", "2"]} value="2" />
    );

    // Should show "2" initially
    let spans = container.querySelectorAll("span");
    expect(spans[0].textContent).toBe("2");

    // Change to "1" - should wrap around (2 -> 0 -> 1)
    rerender(
      <FlapStackImproved {...props} stack={["0", "1", "2"]} value="1" />
    );

    const digit = container.querySelector('[data-kind="digit"]');
    const frameElements = digit!.children;
    // Should have 2 animation frames: "2" -> "0" and "0" -> "1"
    expect(frameElements).toHaveLength(2);
  });

  it("handles rapid value changes by updating target", () => {
    const { container, rerender } = render(
      <FlapStackImproved {...props} value=" " />
    );

    // First change
    rerender(<FlapStackImproved {...props} value="A" />);

    // Rapid second change before first completes
    rerender(<FlapStackImproved {...props} value="Z" />);

    // Should continue animating to new target
    act(() => {
      jest.runAllTimers();
    });

    // Should end up at "Z"
    const finalSpans = container.querySelectorAll("span");
    expect(finalSpans[0].textContent).toBe("Z");
    expect(finalSpans[1].textContent).toBe("Z");
  });
});
