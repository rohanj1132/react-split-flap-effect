import { useEffect, useState } from "react";
import { FlapDisplay, Presets } from "react-split-flap-effect";

export default function SimpleIntegration() {
    const [wordValue, setWordValue] = useState("");
    const [value, setValue] = useState("");
    // set value after 2 seconds to Social
    useEffect(() => {
        const timeout = setTimeout(() => {
            setValue("SOCIAL");
            setWordValue("1");
        }, 2000);
        return () => clearTimeout(timeout);
    }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-8 my-16">
      {/* Alphanumeric display with custom characters */}
      <FlapDisplay
        words={['Hello World', 'Split Flap!', "Social"]}
        // chars="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        timing={300}
        length={11}
        value={wordValue}
        className="my-custom-class"
        hinge={false}
      />

      <FlapDisplay
        chars="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        timing={600}
        length={11}
        value={value}
        className="darkBordered"
        hinge={true}
      />
    </div>
  )
}
