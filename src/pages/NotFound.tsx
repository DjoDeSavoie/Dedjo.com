/** Page affichée pour une adresse inconnue (route « * » de App.tsx). */
const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-muted">
    <div className="text-center">
      <h1 className="mb-4 text-4xl">404</h1>
      <p className="mb-4 text-xl text-muted-foreground">Oups ! Cette page n'existe pas.</p>
      <a href="/" className="text-primary underline hover:text-primary/90">
        Retour à l'accueil
      </a>
    </div>
  </div>
);

export default NotFound;
