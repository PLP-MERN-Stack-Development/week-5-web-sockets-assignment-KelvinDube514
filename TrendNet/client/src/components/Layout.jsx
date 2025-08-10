// Layout.jsx
import Aurora from './Aurora';

export default function Layout({ children }) {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 -z-10">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 backdrop-blur-sm bg-black/20 h-full w-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
