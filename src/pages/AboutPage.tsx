import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <p className="text-sm text-indigo-400 mb-1">
          <Link to="/" className="hover:text-indigo-300 transition-colors">
            &larr; Back to chain
          </Link>
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">About Movie Chain</h1>
        <p className="text-gray-400">
          Movie Chain is a small learning project where you build a path of movies that are all
          connected through the actors who star in them.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">How the chain works</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Pick a starting movie from the home screen (trending list or search).</li>
          <li>From that movie, pick an actor from the cast grid.</li>
          <li>
            You&apos;ll see a list of other movies that actor has appeared in. Choose one to
            continue the chain.
          </li>
          <li>
            On the new movie, pick a different actor from the cast (you can&apos;t reuse the actor
            that just brought you here).
          </li>
          <li>Repeat steps 3–4 to grow your chain as long as you like.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Rules & constraints</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>Each new movie must share an actor with the previous movie in the chain.</li>
          <li>
            The connecting actor is shown between movies in the chain overview, so you can always
            see how you got from one to the next.
          </li>
          <li>
            When choosing an actor on a movie, the actor who connected you to that movie is
            disabled — you have to pick someone else.
          </li>
          <li>
            You can use the <span className="font-semibold">Undo</span> actions to remove the last
            movie in the chain, or <span className="font-semibold">Change actor</span> when
            you&apos;re browsing an actor&apos;s filmography to go back and pick a different actor.
          </li>
          <li>
            Comments you add for each movie are stored locally in your browser, along with the
            chain itself.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Tech behind the scenes</h2>
        <p className="text-gray-300">
          The app is built with React, TypeScript, Vite, Tailwind CSS, and the TMDB API for movie
          and actor data. Your chain and notes are saved to <code>localStorage</code> so you can
          come back to them later on the same device.
        </p>
      </section>

      <footer className="pt-4 border-t border-gray-800 mt-4">
        <p className="text-xs text-gray-500 text-center">
          Designed and implemented by{' '}
          <a
            href="https://github.com/ZhannaM85"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-gray-300 hover:text-indigo-300 underline-offset-2 hover:underline"
          >
            zhannam85
          </a>{' '}
          with love, passion, and Cursor{' '}
          <span className="inline-block text-red-500 align-middle" aria-hidden="true">
            ♥
          </span>
          .
        </p>
      </footer>
    </div>
  );
}

