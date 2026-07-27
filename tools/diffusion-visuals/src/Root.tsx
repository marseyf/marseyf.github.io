import "./index.css";
import {Composition, Still} from "remotion";
import {DiffusionCycle, DiffusionFigure} from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DiffusionCycle"
        component={DiffusionCycle}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Still
        id="DiffusionFigure"
        component={DiffusionFigure}
        width={1920}
        height={1080}
      />
    </>
  );
};
