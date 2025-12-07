export default function Header() {
  return (
    <header className="border-b border-border-primary">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-extrabold text-text-primary">X</div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Kre8</h1>
            <p className="text-sm text-text-secondary">Beat Maker for X</p>
          </div>
        </div>
      </div>
    </header>
  );
}
