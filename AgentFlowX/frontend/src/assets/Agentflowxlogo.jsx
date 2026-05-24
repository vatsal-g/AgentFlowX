export default function AgentFlowXLogo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stylized A / Agent mark */}
      <path
        d="M20 80 L50 20 L80 80"
        stroke="#6366F1"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35 60 H65"
        stroke="#22D3EE"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  )
}
