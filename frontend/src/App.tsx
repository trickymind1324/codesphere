import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route
          path="/"
          element={
            <div className="flex h-screen items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  CodeSphere
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Where Code Meets Reality
                </p>
                <p className="mt-8 text-sm text-muted-foreground">
                  Frontend is running! 🚀
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
