export default function InkFilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter id="inkRough">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" />
      </filter>
    </svg>
  );
}
