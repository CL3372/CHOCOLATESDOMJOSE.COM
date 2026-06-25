function Chip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span
      aria-label={label}
      title={label}
      className="inline-flex h-8 items-center justify-center rounded-md bg-white px-2.5 shadow-sm ring-1 ring-black/5"
    >
      {children}
    </span>
  );
}

function VisaLogo() {
  return (
    <span
      className="text-[15px] font-bold italic tracking-tight"
      style={{ color: "#1434CB", fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      VISA
    </span>
  );
}

function MastercardLogo() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg viewBox="0 0 38 24" className="h-5 w-auto" role="img" aria-hidden="true">
        <circle cx="15" cy="12" r="9" fill="#EB001B" />
        <circle cx="23" cy="12" r="9" fill="#F79E1B" />
        <path
          d="M19 5.2a9 9 0 0 1 0 13.6 9 9 0 0 1 0-13.6z"
          fill="#FF5F00"
        />
      </svg>
      <span
        className="text-[10px] font-semibold lowercase tracking-tight text-neutral-700"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        mastercard
      </span>
    </span>
  );
}

function MbWayLogo() {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="rounded-[3px] px-1 text-[11px] font-extrabold text-white"
        style={{ backgroundColor: "#001E50", fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        MB
      </span>
      <span
        className="text-[12px] font-extrabold tracking-tight"
        style={{ color: "#E2007A", fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        WAY
      </span>
    </span>
  );
}

function MultibancoLogo() {
  return (
    <span
      className="text-[12px] font-extrabold tracking-tight"
      style={{ color: "#005CA9", fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      Multibanco
    </span>
  );
}

function EasypayLogo() {
  return (
    <span
      className="text-[13px] font-bold lowercase tracking-tight"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <span style={{ color: "#1D1D1B" }}>easy</span>
      <span style={{ color: "#E8403A" }}>pay</span>
    </span>
  );
}

export function PaymentLogos() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Chip label="Visa">
        <VisaLogo />
      </Chip>
      <Chip label="Mastercard">
        <MastercardLogo />
      </Chip>
      <Chip label="MB WAY">
        <MbWayLogo />
      </Chip>
      <Chip label="Multibanco">
        <MultibancoLogo />
      </Chip>
      <Chip label="EasyPay">
        <EasypayLogo />
      </Chip>
    </div>
  );
}
