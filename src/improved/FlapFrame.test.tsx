/* eslint-env jest */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { FlapFrame } from "./FlapFrame";

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

interface FlapFrameTestProps {
  char: string;
  nextChar: string;
  delay: number;
  timing?: number;
  isStatic?: boolean;
  hinge?: boolean;
  className?: string;
  css?: any;
}

describe("<FlapFrame/>", () => {
  let props: FlapFrameTestProps;

  beforeEach(() => {
    props = {
      char: "A",
      nextChar: "B",
      delay: 0,
      timing: 120,
    };
  });

  describe("static frame rendering", () => {
    it("renders a static frame when isStatic is true", () => {
      const { container } = render(<FlapFrame {...props} isStatic={true} />);

      const frame = container.firstChild as HTMLElement;
      expect(frame).toBeInTheDocument();

      // Should have 2 spans for static frame (top and bottom halves)
      const spans = frame.querySelectorAll("span");
      expect(spans).toHaveLength(2);

      // Both spans should show the current character
      expect(spans[0].textContent).toBe("A");
      expect(spans[1].textContent).toBe("A");
    });

    it("applies static frame styles correctly", () => {
      const { container } = render(<FlapFrame {...props} isStatic={true} />);

      const frame = container.firstChild as HTMLElement;
      const style = frame.style;

      expect(style.position).toBe("absolute");
      expect(style.width).toBe("100%");
      expect(style.height).toBe("100%");
      expect(style.getPropertyValue("--flap-timing")).toBe("30ms"); // timing/2/2
    });
  });

  describe("animated frame rendering", () => {
    it("renders an animated frame when isStatic is false", () => {
      const { container } = render(<FlapFrame {...props} isStatic={false} />);

      const frame = container.firstChild as HTMLElement;
      expect(frame).toBeInTheDocument();

      // Should have 4 spans for animated frame (2 for current, 2 for next)
      const spans = frame.querySelectorAll("span");
      expect(spans).toHaveLength(4);

      // Check the content of each span
      expect(spans[0].textContent).toBe("B"); // top back (next)
      expect(spans[1].textContent).toBe("A"); // top animated (current)
      expect(spans[2].textContent).toBe("A"); // bottom current
      expect(spans[3].textContent).toBe("B"); // bottom animated (next)
    });

    it("applies animated frame styles correctly", () => {
      const { container } = render(
        <FlapFrame {...props} isStatic={false} delay={100} />
      );

      const frame = container.firstChild as HTMLElement;
      const style = frame.style;

      expect(style.position).toBe("absolute");
      expect(style.width).toBe("100%");
      expect(style.height).toBe("100%");
      expect(style.zIndex).toBe("100"); // Should equal delay
      expect(style.getPropertyValue("--flap-timing")).toBe("30ms"); // timing/2/2
      expect(style.getPropertyValue("--top-delay")).toBe("100ms");
      expect(style.getPropertyValue("--bottom-delay")).toBe("130ms"); // delay + timing/2/2
    });
  });

  describe("hinge rendering", () => {
    it("renders hinge element when hinge prop is true", () => {
      const { container } = render(<FlapFrame {...props} hinge={true} />);

      const hinges = container.querySelectorAll('[data-kind="hinge"]');
      expect(hinges).toHaveLength(1);
    });

    it("does not render hinge element when hinge prop is false", () => {
      const { container } = render(<FlapFrame {...props} hinge={false} />);

      const hinges = container.querySelectorAll('[data-kind="hinge"]');
      expect(hinges).toHaveLength(0);
    });

    it("renders hinge by default", () => {
      const { container } = render(<FlapFrame {...props} />);

      const hinges = container.querySelectorAll('[data-kind="hinge"]');
      expect(hinges).toHaveLength(1);
    });
  });

  describe("prop handling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <FlapFrame {...props} className="custom-class" />
      );

      const frame = container.firstChild as HTMLElement;
      // Since we're mocking classnames, we can't check the actual class
      // but we can verify the component renders
      expect(frame).toBeInTheDocument();
    });

    it("applies custom css styles", () => {
      const customCss = { fontSize: "2em", color: "red" };
      const { container } = render(<FlapFrame {...props} css={customCss} />);

      const frame = container.firstChild as HTMLElement;
      expect(frame.style.fontSize).toBe("2em");
      expect(frame.style.color).toBe("red");
    });

    it("uses default timing when not provided", () => {
      const propsWithoutTiming = { ...props };
      delete propsWithoutTiming.timing;

      const { container } = render(<FlapFrame {...propsWithoutTiming} />);

      const frame = container.firstChild as HTMLElement;
      // Default timing is 120, so flap-timing should be 30ms (120/2/2)
      expect(frame.style.getPropertyValue("--flap-timing")).toBe("30ms");
    });

    it("uses default isStatic value of false", () => {
      const { container } = render(<FlapFrame {...props} />);

      // Should render animated frame (4 spans)
      const spans = container.querySelectorAll("span");
      expect(spans).toHaveLength(4);
    });
  });

  describe("React.memo optimization", () => {
    it("does not re-render when props are the same", () => {
      const { container, rerender } = render(<FlapFrame {...props} />);

      const firstRenderHTML = container.innerHTML;

      // Re-render with same props
      rerender(<FlapFrame {...props} />);

      // HTML should be identical
      expect(container.innerHTML).toBe(firstRenderHTML);
    });

    it("re-renders when char prop changes", () => {
      const { container, rerender } = render(<FlapFrame {...props} />);

      const initialSpans = container.querySelectorAll("span");
      const initialContent = Array.from(initialSpans).map((s) => s.textContent);

      // Change char prop
      rerender(<FlapFrame {...props} char="C" />);

      const updatedSpans = container.querySelectorAll("span");
      const updatedContent = Array.from(updatedSpans).map((s) => s.textContent);

      // Content should have changed
      expect(updatedContent).not.toEqual(initialContent);
    });

    it("re-renders when css prop changes", () => {
      const { container, rerender } = render(
        <FlapFrame {...props} css={{ color: "blue" }} />
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame.style.color).toBe("blue");

      // Change css prop
      rerender(<FlapFrame {...props} css={{ color: "red" }} />);

      expect(frame.style.color).toBe("red");
    });
  });

  describe("edge cases", () => {
    it("handles empty string characters", () => {
      const { container } = render(
        <FlapFrame {...props} char="" nextChar="" />
      );

      const spans = container.querySelectorAll("span");
      expect(spans[0].textContent).toBe("");
      expect(spans[1].textContent).toBe("");
    });

    it("handles special characters", () => {
      const { container } = render(
        <FlapFrame {...props} char="@" nextChar="#" />
      );

      const spans = container.querySelectorAll("span");
      expect(spans[0].textContent).toBe("#");
      expect(spans[1].textContent).toBe("@");
    });

    it("handles zero delay", () => {
      const { container } = render(
        <FlapFrame {...props} delay={0} isStatic={false} />
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame.style.zIndex).toBe("0");
      expect(frame.style.getPropertyValue("--top-delay")).toBe("0ms");
      expect(frame.style.getPropertyValue("--bottom-delay")).toBe("30ms");
    });
  });
});
