import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const INK = "#f4f7f8";
const MUTED = "#aab7bc";
const CYAN = "#52c7df";
const AMBER = "#f0ae55";
const PANEL = "#0b1013";
const CT_CROP = {x: 0, y: 50, width: 350, height: 350};

const alphaBar = (progress: number) => {
  const offset = 0.008;
  const initial = Math.cos((offset / (1 + offset)) * (Math.PI / 2)) ** 2;
  return (
    Math.cos(((progress + offset) / (1 + offset)) * (Math.PI / 2)) ** 2 /
    initial
  );
};

const hash = (value: number) => {
  const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const gaussian = (index: number) => {
  const u1 = Math.max(hash(index * 2 + 17), 1e-7);
  const u2 = hash(index * 2 + 29);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

type DiffusedCtProps = {
  progress: number;
  size: number;
  style?: CSSProperties;
};

const DiffusedCt: React.FC<DiffusedCtProps> = ({progress, size, style}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [renderHandle] = useState(() => delayRender("Loading source CT"));

  useEffect(() => {
    const source = new Image();
    source.src = staticFile("ct-normal-brain-axial-25.png");
    source.onload = () => {
      setImage(source);
      continueRender(renderHandle);
    };
    return () => {
      source.onload = null;
    };
  }, [renderHandle]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) {
      return;
    }

    const context = canvas.getContext("2d", {willReadFrequently: true});
    if (!context) {
      return;
    }

    context.drawImage(
      image,
      CT_CROP.x,
      CT_CROP.y,
      CT_CROP.width,
      CT_CROP.height,
      0,
      0,
      size,
      size,
    );

    const imageData = context.getImageData(0, 0, size, size);
    const pixels = imageData.data;
    const signal = Math.sqrt(Math.max(0, alphaBar(progress)));
    const noise = Math.sqrt(Math.max(0, 1 - alphaBar(progress)));

    for (let pixel = 0; pixel < size * size; pixel++) {
      const offset = pixel * 4;
      const clean = pixels[offset] / 127.5 - 1;
      const value = signal * clean + noise * gaussian(pixel);
      const display = Math.round(Math.max(0, Math.min(1, (value + 1) / 2)) * 255);
      pixels[offset] = display;
      pixels[offset + 1] = display;
      pixels[offset + 2] = display;
      pixels[offset + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
  }, [image, progress, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        background: "#000",
        ...style,
      }}
    />
  );
};

const ProcessLabel: React.FC<{
  phase: "forward" | "reverse";
  timestep: number;
}> = ({phase, timestep}) => {
  const isForward = phase === "forward";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        color: isForward ? CYAN : AMBER,
        fontSize: 34,
        fontWeight: 700,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "currentColor",
          boxShadow: "0 0 24px currentColor",
        }}
      />
      <span>
        {isForward
          ? "Forward noising  q(xₜ | x₀)"
          : "Idealized reverse sampling  pθ(xₜ₋₁ | xₜ, c)"}
      </span>
      <span style={{color: MUTED, fontWeight: 500, marginLeft: "auto"}}>
        t = {timestep.toString().padStart(4, "0")}
      </span>
    </div>
  );
};

export const DiffusionCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const forwardEnd = 106;
  const reverseStart = 130;
  const forward = interpolate(frame, [14, forwardEnd], [0, 1], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const reverse = interpolate(frame, [reverseStart, durationInFrames - 14], [1, 0], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isForward = frame < reverseStart;
  const progress = isForward ? forward : reverse;
  const variance = alphaBar(progress);
  const phaseColor = isForward ? CYAN : AMBER;
  const endpointLabel =
    progress < 0.02 ? "real CT · x₀" : progress > 0.98 ? "Gaussian noise · xT" : "noisy state · xₜ";

  return (
    <AbsoluteFill
      style={{
        background: "#05090c",
        color: INK,
        fontFamily: "Inter, Arial, sans-serif",
        padding: "64px 104px 54px",
      }}
    >
      <Img
        src={staticFile("diffusion-editorial-backdrop.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.25,
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "grid",
          gridTemplateRows: "124px 1fr 176px",
        }}
      >
        <header>
          <div style={{fontSize: 62, fontWeight: 760, lineHeight: 1.08}}>
            Diffusion is a trajectory, not a single transformation
          </div>
          <div style={{fontSize: 27, color: MUTED, marginTop: 17}}>
            One fixed Gaussian field · cosine variance schedule · real CC0 axial CT
          </div>
        </header>

        <main
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 84,
            minHeight: 0,
          }}
        >
          <div
            style={{
              width: 590,
              height: 590,
              padding: 10,
              background: PANEL,
              border: `2px solid ${phaseColor}`,
              boxShadow: `0 0 70px ${phaseColor}24`,
            }}
          >
            <DiffusedCt progress={progress} size={320} />
          </div>

          <div style={{width: 600, display: "grid", gap: 34}}>
            <ProcessLabel
              phase={isForward ? "forward" : "reverse"}
              timestep={Math.round(progress * 1000)}
            />
            <div
              style={{
                height: 9,
                background: "#253036",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${progress * 100}%`,
                  background: phaseColor,
                }}
              />
            </div>
            <div style={{fontSize: 70, fontWeight: 760}}>{endpointLabel}</div>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26}}>
              <div>
                <div style={{fontSize: 25, color: MUTED}}>signal variance ᾱₜ</div>
                <div style={{fontSize: 52, fontVariantNumeric: "tabular-nums"}}>
                  {variance.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{fontSize: 25, color: MUTED}}>noise variance 1 − ᾱₜ</div>
                <div style={{fontSize: 52, fontVariantNumeric: "tabular-nums"}}>
                  {(1 - variance).toFixed(2)}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.45,
                color: MUTED,
                borderLeft: `5px solid ${phaseColor}`,
                paddingLeft: 22,
              }}
            >
              {isForward
                ? "Known process: calibrated Gaussian noise is added."
                : "Illustration: a trained model must estimate the noise at every step."}
            </div>
          </div>
        </main>

        <footer
          style={{
            alignSelf: "end",
            borderTop: "1px solid #344047",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            gap: 60,
            color: MUTED,
            fontSize: 23,
          }}
        >
          <span>
            xₜ = √ᾱₜ x₀ + √(1 − ᾱₜ) ε, &nbsp; ε ~ N(0, I)
          </span>
          <span>Educational illustration · not model output or clinical data</span>
        </footer>
      </div>
    </AbsoluteFill>
  );
};

const figureStages = [0, 0.25, 0.5, 0.75, 1];

export const DiffusionFigure: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        color: INK,
        fontFamily: "Inter, Arial, sans-serif",
        background: "#05090c",
      }}
    >
      <Img
        src={staticFile("diffusion-editorial-backdrop.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(3, 7, 10, 0.2)",
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          padding: "64px 76px 48px",
          display: "grid",
          gridTemplateRows: "128px 1fr 152px",
        }}
      >
        <header style={{textAlign: "center"}}>
          <div style={{fontSize: 59, fontWeight: 760, lineHeight: 1.08}}>
            From medical image to noise, then back by learned denoising
          </div>
          <div style={{fontSize: 27, color: MUTED, marginTop: 17}}>
            Real axial CT · fixed Gaussian noise · cosine schedule
          </div>
        </header>

        <main
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            alignItems: "center",
            gap: 42,
          }}
        >
          {figureStages.map((stage, index) => (
            <div
              key={stage}
              style={{
                display: "grid",
                gap: 18,
                justifyItems: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 278,
                  height: 278,
                  padding: 7,
                  background: "#05090c",
                  border: `2px solid ${index < 3 ? CYAN : index > 2 ? AMBER : INK}`,
                  boxShadow: "0 14px 36px rgba(0,0,0,.36)",
                }}
              >
                <DiffusedCt progress={stage} size={256} />
              </div>
              <div style={{fontSize: 31, fontWeight: 730}}>
                {index === 0 ? "x₀ · real CT" : index === 4 ? "xT · noise" : `x${index * 250}`}
              </div>
              <div style={{fontSize: 22, color: MUTED}}>
                ᾱₜ = {alphaBar(stage).toFixed(2)}
              </div>
              {index < figureStages.length - 1 ? (
                <div
                  style={{
                    position: "absolute",
                    top: 122,
                    right: -39,
                    fontSize: 42,
                    color: index < 2 ? CYAN : AMBER,
                  }}
                >
                  →
                </div>
              ) : null}
            </div>
          ))}
        </main>

        <footer
          style={{
            borderTop: "1px solid #465159",
            paddingTop: 22,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "start",
            gap: 34,
            fontSize: 25,
          }}
        >
          <div style={{color: CYAN, fontWeight: 700}}>
            Forward q · known corruption →
          </div>
          <div style={{color: MUTED, textAlign: "center", lineHeight: 1.35}}>
            xₜ = √ᾱₜ x₀ + √(1 − ᾱₜ) ε
            <br />
            <span style={{fontSize: 21}}>
              Reverse path is illustrative, not model output
            </span>
          </div>
          <div style={{color: AMBER, fontWeight: 700, textAlign: "right"}}>
            ← Reverse pθ · learned sampling
          </div>
        </footer>
      </div>
    </AbsoluteFill>
  );
};
