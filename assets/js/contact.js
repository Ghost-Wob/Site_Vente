/* contact.js : formulaire de contact. Sans service de formulaire (SITE.formEndpoint), le message s'ouvre dans la messagerie du visiteur. */
(() => {
  const f = document.getElementById('devis'), st = document.getElementById('form-status');
  if (!f) return;
  const say = (m, err) => { st.textContent = m; st.classList.toggle('err', !!err); };
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (d.hp) return;                       // champ piège : un robot l'a rempli
    delete d.hp;
    const subject = `Projet web : ${d.type}${d.entreprise ? ' (' + d.entreprise + ')' : ''}`;
    const lines = [`Nom : ${d.nom}`, d.entreprise && `Entreprise : ${d.entreprise}`, `Email : ${d.email}`, `Type de projet : ${d.type}`, d.budget && `Budget indicatif : ${d.budget}`].filter(Boolean);
    const body = lines.join('\n') + '\n\n' + d.besoin;
    if (SITE.formEndpoint) {
      try {
        const r = await fetch(SITE.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) });
        if (!r.ok) throw new Error(r.status);
        f.reset(); say('Merci, votre message a bien été envoyé.');
      } catch (err) {
        say("L'envoi a échoué. Vous pouvez m'écrire directement par email.", true);
      }
      return;
    }
    if (!real(SITE.email)) { say("Le formulaire n'est pas encore relié à une adresse email : renseignez SITE.email dans assets/js/app.js.", true); return; }
    location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    say("Votre messagerie s'ouvre avec le message prérempli : il ne reste qu'à l'envoyer.");
  });
})();
