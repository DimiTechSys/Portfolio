export function Testimonial() {
  return (
    <section aria-labelledby="testimonial-title" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 id="testimonial-title" className="sr-only">
          Témoignage pilote
        </h2>
        <figure>
          <svg className="mx-auto h-10 w-10 text-teal-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9.5 6C5.5 6 3 9 3 13c0 3 2 5 5 5v-3c-1.5 0-2-1-2-2 0-2 1.5-3 3.5-3V6zM18 6c-4 0-6.5 3-6.5 7 0 3 2 5 5 5v-3c-1.5 0-2-1-2-2 0-2 1.5-3 3.5-3V6z" />
          </svg>
          <blockquote className="mt-8 text-center text-2xl font-medium text-balance text-slate-900 sm:text-3xl">
            En deux semaines, on a arrêté le cahier de transmission et le groupe WhatsApp.
            L’équipe sait quoi faire en arrivant, et moi je vois ce qui se passe même quand
            je ne suis pas à l’officine.
          </blockquote>
          <figcaption className="mt-8 flex items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-300 to-cyan-200" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">Dr. Sophie B.</p>
              <p className="text-sm text-slate-500">Titulaire, Pharmacie pilote, Nice</p>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
