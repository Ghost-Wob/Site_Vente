/* planning.js : logique du planning 24/7 (Vue 3). Isolée dans une fonction pour ne pas entrer en collision avec app.js. */
(() => {
        /* Si Vue n'a pas pu être chargé (réseau, bloqueur de contenu), on l'indique au lieu d'afficher une page vide. */
        if (typeof Vue === 'undefined') {
            const app = document.getElementById('app');
            if (app) {
                app.removeAttribute('v-cloak');
                app.innerHTML = '<p class="pl-fail">Le planning n\'a pas pu démarrer : la bibliothèque Vue n\'a pas été chargée (connexion ou bloqueur de contenu). Rechargez la page.</p>';
            }
            return;
        }
        /* ===== helpers données (validation, import) ===== */
        const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
        const HEX_RE = /^#[0-9a-fA-F]{6}$/;
        const newId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
        const fixTime = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? '').trim()); return m ? m[1].padStart(2, '0') + ':' + m[2] : ''; };
        const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

        /* Tags : nom obligatoire, identifiant unique, couleur hexadécimale */
        const cleanTags = (list) => {
            const seen = new Set(), out = [];
            (Array.isArray(list) ? list : []).forEach(t => {
                if (!t || typeof t !== 'object') return;
                const name = String(t.name ?? '').trim().slice(0, 40);
                if (!name) return;
                let id = String(t.id ?? '').trim() || 't_' + newId();
                if (seen.has(id)) id = 't_' + newId();
                seen.add(id);
                out.push({ id, name, color: HEX_RE.test(t.color) ? t.color : '#64748b' });
            });
            return out;
        };

        /* Activités : titre, jour 0 à 6, heures HH:MM avec fin > début ; sinon l'activité est ignorée et comptée */
        const cleanEvents = (list, tagIds) => {
            const out = [], seen = new Set(); let skipped = 0;
            (Array.isArray(list) ? list : []).forEach(e => {
                if (!e || typeof e !== 'object') { skipped++; return; }
                const day = Number(e.day), start = fixTime(e.startTime), end = fixTime(e.endTime);
                const title = String(e.title ?? '').trim().slice(0, 80);
                if (!title || !Number.isInteger(day) || day < 0 || day > 6 || !TIME_RE.test(start) || !TIME_RE.test(end) || toMin(end) <= toMin(start)) { skipped++; return; }
                let id = String(e.id ?? '').trim();
                if (!id || seen.has(id)) id = newId();
                seen.add(id);
                out.push({
                    id, title, day, startTime: start, endTime: end,
                    location: String(e.location ?? '').slice(0, 80),
                    tags: [...new Set((Array.isArray(e.tags) ? e.tags : []).map(String).filter(t => tagIds.has(t)))],
                    bgColor: HEX_RE.test(e.bgColor) ? e.bgColor : '#dbeafe',
                    borderColor: HEX_RE.test(e.borderColor) ? e.borderColor : '#93c5fd',
                    textColor: HEX_RE.test(e.textColor) ? e.textColor : '#1e40af'
                });
            });
            return { events: out, skipped };
        };

        /* Import : « replace » remplace tout, « merge » ajoute sans doublon (même jour, mêmes heures, même titre) et fusionne les tags */
        const mergeImport = (data, mode, curEvents, curTags) => {
            const incomingTags = cleanTags(data.tags), idMap = new Map();
            let nextTags;
            if (mode === 'replace') {
                nextTags = incomingTags.length ? incomingTags : curTags.map(t => ({ ...t }));
            } else {
                nextTags = curTags.map(t => ({ ...t }));
                incomingTags.forEach(t => {
                    const same = nextTags.find(x => x.id === t.id) || nextTags.find(x => x.name.toLowerCase() === t.name.toLowerCase());
                    if (same) idMap.set(t.id, same.id); else nextTags.push(t);
                });
            }
            const known = new Set(nextTags.map(t => t.id));
            const mapped = data.events.map(e => (e && typeof e === 'object')
                ? { ...e, tags: (Array.isArray(e.tags) ? e.tags : []).map(id => idMap.get(String(id)) ?? String(id)) } : e);
            const { events: cleaned, skipped } = cleanEvents(mapped, known);
            if (mode === 'replace') return { events: cleaned, tags: nextTags, added: cleaned.length, dup: 0, skipped };
            const key = e => [e.day, e.startTime, e.endTime, e.title.toLowerCase()].join('|');
            const have = new Set(curEvents.map(key)), used = new Set(curEvents.map(e => e.id)), added = [];
            let dup = 0;
            cleaned.forEach(e => {
                if (have.has(key(e))) { dup++; return; }
                have.add(key(e));
                if (used.has(e.id)) e.id = newId();
                used.add(e.id); added.push(e);
            });
            return { events: [...curEvents, ...added], tags: nextTags, added: added.length, dup, skipped };
        };
        /* ===== fin helpers ===== */

        const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

        const app = createApp({
            setup() {
                const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

                // Color Presets
                const colorPresets = [
                    { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' }, // Blue
                    { bg: '#dcfce7', border: '#86efac', text: '#166534' }, // Emerald
                    { bg: '#fef3c7', border: '#fde047', text: '#92400e' }, // Amber
                    { bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8' }, // Purple
                    { bg: '#ffe4e6', border: '#fda4af', text: '#9f1239' }, // Rose
                    { bg: '#ccfbf1', border: '#5eead4', text: '#115e59' }, // Teal
                    { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' }, // Orange
                    { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' }  // Slate
                ];

                // Default Tags
                const defaultTags = [
                    { id: 't1', name: 'Cours / Études', color: '#3b82f6' },
                    { id: 't2', name: 'Travail', color: '#f59e0b' },
                    { id: 't3', name: 'Sommeil', color: '#6366f1' },
                    { id: 't4', name: 'Sport', color: '#10b981' },
                    { id: 't5', name: 'Loisirs', color: '#ec4899' },
                    { id: 't6', name: 'Projets', color: '#8b5cf6' },
                    { id: 't7', name: 'Repas', color: '#f97316' }
                ];

                // App State
                const events = ref([]);
                const tags = ref([...defaultTags]);
                const selectedTagFilters = ref([]);
                const searchQuery = ref('');
                const importMode = ref('merge'); // 'merge' ou 'replace'

                // Modals
                const isModalOpen = ref(false);
                const isTagModalOpen = ref(false);
                const isExportModalOpen = ref(false);
                const editingId = ref(null);

                // Toast & Confirmation
                const confirmDialog = ref({ show: false, title: '', message: '', action: null });

                // Event Form State
                const form = ref({
                    title: '',
                    day: 0,
                    startTime: '08:00',
                    endTime: '10:00',
                    location: '',
                    tags: ['t1'],
                    bgColor: colorPresets[0].bg,
                    borderColor: colorPresets[0].border,
                    textColor: colorPresets[0].text
                });

                // Tag Form State
                const tagForm = ref({ id: null, name: '', color: '#3b82f6' });

                // Current day & Time indicator
                const currentDayIndex = ref((new Date().getDay() + 6) % 7); // 0 = Lundi, 6 = Dimanche
                const liveHour = ref(0); // heure actuelle en décimal (14,5 = 14h30)
                let timerInterval = null;

                // Format Hour helper (e.g. 8 -> 08:00)
                const formatHour = (h) => `${h.toString().padStart(2, '0')}:00`;

                // Convert "HH:MM" to Float
                const timeToFloat = (timeStr) => {
                    if (!timeStr) return 0;
                    const [h, m] = timeStr.split(':').map(Number);
                    return h + (m / 60);
                };

                // Get Tag object by ID
                const getTagById = (tagId) => tags.value.find(t => t.id === tagId);

                // Event position in grid : la hauteur d'une heure vient de la variable CSS --hh (voir planning.css)
                const getEventStyle = (event) => {
                    const start = timeToFloat(event.startTime);
                    const duration = Math.max(timeToFloat(event.endTime) - start, 0.25);
                    return {
                        top: `calc(var(--hh) * ${start})`,
                        height: `max(calc(var(--hh) * ${duration} - 2px), var(--evmin))`,
                        '--ev-bg': event.bgColor || '#dbeafe',
                        '--ev-bd': event.borderColor || '#93c5fd',
                        '--ev-tx': event.textColor || '#0f172a'
                    };
                };

                // Taille d'une activité (sert à alléger l'affichage des petites activités à l'impression)
                const evSize = (event) => {
                    const d = timeToFloat(event.endTime) - timeToFloat(event.startTime);
                    return d <= 0.5 ? 'pl-xs' : d <= 1 ? 'pl-s' : d <= 2 ? 'pl-m' : 'pl-l';
                };

                // Filter events by search, day, and active tag filters
                const filteredEventsByDay = (dayIndex) => {
                    return events.value.filter(ev => {
                        if (ev.day !== dayIndex) return false;

                        // Tag filter
                        if (selectedTagFilters.value.length > 0) {
                            const hasMatchingTag = ev.tags && ev.tags.some(tId => selectedTagFilters.value.includes(tId));
                            if (!hasMatchingTag) return false;
                        }

                        // Text search
                        if (searchQuery.value) {
                            const query = searchQuery.value.toLowerCase();
                            const titleMatch = ev.title.toLowerCase().includes(query);
                            const locationMatch = ev.location && ev.location.toLowerCase().includes(query);
                            return titleMatch || locationMatch;
                        }

                        return true;
                    });
                };

                // Calculate hours per day
                const getDayTotalHours = (dayIndex) => {
                    const dayEvs = events.value.filter(e => e.day === dayIndex);
                    const total = dayEvs.reduce((acc, curr) => acc + (timeToFloat(curr.endTime) - timeToFloat(curr.startTime)), 0);
                    return Math.round(total * 10) / 10;
                };

                // Calculate total weekly hours
                const totalWeeklyHours = computed(() => {
                    const total = events.value.reduce((acc, curr) => acc + (timeToFloat(curr.endTime) - timeToFloat(curr.startTime)), 0);
                    return Math.round(total * 10) / 10;
                });

                // Tag statistics breakdown
                const tagStats = computed(() => {
                    const totalHours = totalWeeklyHours.value || 1;
                    return tags.value.map(tag => {
                        const tagEvents = events.value.filter(e => e.tags && e.tags.includes(tag.id));
                        const hours = tagEvents.reduce((acc, curr) => acc + (timeToFloat(curr.endTime) - timeToFloat(curr.startTime)), 0);
                        const roundedHours = Math.round(hours * 10) / 10;
                        const percentage = Math.round((roundedHours / totalHours) * 100);

                        return {
                            id: tag.id,
                            name: tag.name,
                            color: tag.color,
                            hours: roundedHours,
                            percentage: isNaN(percentage) ? 0 : percentage
                        };
                    }).sort((a, b) => b.hours - a.hours);
                });

                // Count events for a tag
                const getTagCount = (tagId) => {
                    return events.value.filter(e => e.tags && e.tags.includes(tagId)).length;
                };

                // Toast helper
                const showToast = (message) => window.toast(message); /* notification partagée du site (app.js) */

                // Custom confirmation dialog trigger
                const triggerConfirm = (title, message, action) => {
                    confirmDialog.value = { show: true, title, message, action };
                };

                const executeConfirmAction = () => {
                    if (confirmDialog.value.action) confirmDialog.value.action();
                    confirmDialog.value.show = false;
                };

                // Toggle tag filter
                const toggleTagFilter = (tagId) => {
                    const idx = selectedTagFilters.value.indexOf(tagId);
                    if (idx > -1) {
                        selectedTagFilters.value.splice(idx, 1);
                    } else {
                        selectedTagFilters.value.push(tagId);
                    }
                };

                const getTagFilterStyle = (tag) => {
                    const active = selectedTagFilters.value.includes(tag.id);
                    return {
                        backgroundColor: active ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: active ? '#ffffff' : tag.color
                    };
                };

                // Modal opening
                const openModal = (eventData = null) => {
                    if (eventData) {
                        editingId.value = eventData.id;
                        form.value = JSON.parse(JSON.stringify(eventData));
                    } else {
                        editingId.value = null;
                        form.value = {
                            title: '',
                            day: 0,
                            startTime: '08:00',
                            endTime: '10:00',
                            location: '',
                            tags: tags.value.length > 0 ? [tags.value[0].id] : [],
                            bgColor: colorPresets[0].bg,
                            borderColor: colorPresets[0].border,
                            textColor: colorPresets[0].text
                        };
                    }
                    isModalOpen.value = true;
                };

                const quickAddEvent = (dayIndex, hour) => {
                    const endHour = Math.min(hour + 1, 23);
                    const startStr = `${hour.toString().padStart(2, '0')}:00`;
                    const endStr = hour === 23 ? '23:59' : `${endHour.toString().padStart(2, '0')}:00`;

                    openModal({
                        id: null,
                        title: '',
                        day: dayIndex,
                        startTime: startStr,
                        endTime: endStr,
                        location: '',
                        tags: tags.value.length > 0 ? [tags.value[0].id] : [],
                        bgColor: colorPresets[0].bg,
                        borderColor: colorPresets[0].border,
                        textColor: colorPresets[0].text
                    });
                };

                const closeModal = () => {
                    isModalOpen.value = false;
                };

                const toggleFormTag = (tagId) => {
                    const idx = form.value.tags.indexOf(tagId);
                    if (idx > -1) {
                        form.value.tags.splice(idx, 1);
                    } else {
                        form.value.tags.push(tagId);
                    }
                };

                // Save or Update Event
                const saveEvent = () => {
                    if (timeToFloat(form.value.endTime) <= timeToFloat(form.value.startTime)) {
                        showToast("L'heure de fin doit être supérieure à l'heure de début.");
                        return;
                    }

                    if (editingId.value) {
                        const idx = events.value.findIndex(e => e.id === editingId.value);
                        if (idx !== -1) {
                            events.value[idx] = { ...form.value, id: editingId.value };
                            showToast("Activité modifiée !");
                        }
                    } else {
                        events.value.push({
                            ...form.value,
                            id: Date.now().toString(36) + Math.random().toString(36).substring(2)
                        });
                        showToast("Activité ajoutée au planning !");
                    }

                    saveToLocalStorage();
                    closeModal();
                };

                const editEvent = (event) => openModal(event);

                const duplicateEvent = (event) => {
                    const duplicated = JSON.parse(JSON.stringify(event));
                    duplicated.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
                    duplicated.title += ' (Copie)';
                    events.value.push(duplicated);
                    saveToLocalStorage();
                    showToast("Activité dupliquée !");
                };

                const askDeleteEvent = (id) => {
                    triggerConfirm(
                        "Supprimer l'activité ?",
                        "Cette action retirera cet événement de votre emploi du temps.",
                        () => {
                            events.value = events.value.filter(e => e.id !== id);
                            saveToLocalStorage();
                            showToast("Activité supprimée.");
                        }
                    );
                };

                // Tag Management Logic
                const saveTag = () => {
                    if (!tagForm.value.name.trim()) return;

                    if (tagForm.value.id) {
                        const idx = tags.value.findIndex(t => t.id === tagForm.value.id);
                        if (idx !== -1) {
                            tags.value[idx] = { ...tagForm.value };
                            showToast("Tag mis à jour.");
                        }
                    } else {
                        tags.value.push({
                            id: 't_' + Date.now().toString(36),
                            name: tagForm.value.name.trim(),
                            color: tagForm.value.color
                        });
                        showToast("Nouveau tag créé !");
                    }

                    resetTagForm();
                    saveToLocalStorage();
                };

                const editTag = (tag) => {
                    tagForm.value = { ...tag };
                };

                const resetTagForm = () => {
                    tagForm.value = { id: null, name: '', color: '#3b82f6' };
                };

                const askDeleteTag = (tagId) => {
                    triggerConfirm(
                        "Supprimer ce tag ?",
                        "Le tag sera supprimé et retiré de toutes les activités associées.",
                        () => {
                            tags.value = tags.value.filter(t => t.id !== tagId);
                            // Clean up events tags
                            events.value.forEach(ev => {
                                ev.tags = ev.tags.filter(t => t !== tagId);
                            });
                            saveToLocalStorage();
                            showToast("Tag supprimé.");
                        }
                    );
                };

                const askClearAll = () => {
                    triggerConfirm(
                        "Réinitialiser tout le planning ?",
                        "Attention : toutes vos activités et tags seront définitivement effacés.",
                        () => {
                            events.value = [];
                            tags.value = [...defaultTags];
                            saveToLocalStorage();
                            isExportModalOpen.value = false;
                            showToast("Planning réinitialisé.");
                        }
                    );
                };

                // LocalStorage Persistence
                const saveToLocalStorage = () => {
                    try {
                        localStorage.setItem('edutime_247_events', JSON.stringify(events.value));
                        localStorage.setItem('edutime_247_tags', JSON.stringify(tags.value));
                    } catch (e) {
                        showToast("Sauvegarde automatique impossible (stockage du navigateur plein ou désactivé). Pensez à exporter.");
                    }
                };

                const loadFromLocalStorage = () => {
                    let savedEvents = null, savedTags = null;
                    try {
                        savedEvents = localStorage.getItem('edutime_247_events');
                        savedTags = localStorage.getItem('edutime_247_tags');
                    } catch (e) { /* stockage indisponible */ }

                    if (savedTags !== null) {
                        try { const parsed = JSON.parse(savedTags); if (Array.isArray(parsed)) tags.value = cleanTags(parsed); } catch (e) {}
                    }
                    if (savedEvents !== null) {
                        try { events.value = cleanEvents(JSON.parse(savedEvents), new Set(tags.value.map(t => t.id))).events; } catch (e) {}
                    } else {
                        loadDemo247Data();
                    }
                };

                // JSON Export : fichier .json (Blob) contenant les activités et les tags
                const downloadJSON = () => {
                    const payload = { app: 'planning-247', version: '247_v1', exportedAt: new Date().toISOString(), events: events.value, tags: tags.value };
                    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = `planning_247_${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(anchor);
                    anchor.click();
                    anchor.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    showToast(`Planning exporté (${events.value.length} activités).`);
                };

                // JSON Import : validation, puis fusion ou remplacement (avec confirmation avant de remplacer)
                const applyImport = (data, mode) => {
                    const r = mergeImport(data, mode, events.value, tags.value);
                    events.value = r.events;
                    tags.value = r.tags;
                    saveToLocalStorage();
                    isExportModalOpen.value = false;
                    let msg = `${r.added} activité(s) importée(s)`;
                    if (r.dup) msg += `, ${r.dup} doublon(s) ignoré(s)`;
                    if (r.skipped) msg += `, ${r.skipped} invalide(s) ignorée(s)`;
                    showToast(msg + '.');
                };

                const importJSON = (ev) => {
                    const input = ev.target, file = input.files && input.files[0];
                    input.value = ''; // permet de réimporter le même fichier
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) { showToast('Fichier trop volumineux (2 Mo maximum).'); return; }

                    const reader = new FileReader();
                    reader.onerror = () => showToast('Lecture du fichier impossible.');
                    reader.onload = () => {
                        let data;
                        try { data = JSON.parse(reader.result); } catch (e) { showToast("Ce fichier n'est pas un JSON valide."); return; }
                        if (Array.isArray(data)) data = { events: data };
                        if (!data || !Array.isArray(data.events)) { showToast("Format non reconnu : la liste « events » est absente."); return; }

                        const mode = importMode.value;
                        if (mode === 'replace' && events.value.length) {
                            triggerConfirm(
                                'Remplacer le planning actuel ?',
                                `Vos ${events.value.length} activités actuelles seront remplacées par le contenu du fichier (${data.events.length} activités). Exportez d'abord une sauvegarde si besoin.`,
                                () => applyImport(data, 'replace')
                            );
                        } else {
                            applyImport(data, mode);
                        }
                    };
                    reader.readAsText(file);
                };

                // Demo Data Load
                const applyDemo = () => {
                    tags.value = [...defaultTags];
                    events.value = [
                        // Sommeil récurrent
                        { id: '1', title: 'Sommeil & Récupération', day: 0, startTime: '00:00', endTime: '07:00', location: 'Maison', tags: ['t3'], bgColor: '#f3e8ff', borderColor: '#d8b4fe', textColor: '#6b21a8' },
                        { id: '2', title: 'Sommeil & Récupération', day: 1, startTime: '00:00', endTime: '07:00', location: 'Maison', tags: ['t3'], bgColor: '#f3e8ff', borderColor: '#d8b4fe', textColor: '#6b21a8' },
                        { id: '3', title: 'Sommeil & Récupération', day: 2, startTime: '00:00', endTime: '07:30', location: 'Maison', tags: ['t3'], bgColor: '#f3e8ff', borderColor: '#d8b4fe', textColor: '#6b21a8' },
                        
                        // Cours & Travail
                        { id: '4', title: 'Mathématiques & Algo', day: 0, startTime: '08:30', endTime: '11:30', location: 'Salle 102', tags: ['t1'], bgColor: '#dbeafe', borderColor: '#93c5fd', textColor: '#1e40af' },
                        { id: '5', title: 'Développement Web JS/Vue', day: 0, startTime: '13:00', endTime: '17:00', location: 'Amphi B', tags: ['t1', 't6'], bgColor: '#ccfbf1', borderColor: '#5eead4', textColor: '#115e59' },
                        { id: '6', title: 'Travail / Projet Client', day: 1, startTime: '09:00', endTime: '12:00', location: 'Bureau', tags: ['t2', 't6'], bgColor: '#fef3c7', borderColor: '#fde047', textColor: '#92400e' },
                        
                        // Repas & Pauses
                        { id: '7', title: 'Déjeuner', day: 0, startTime: '12:00', endTime: '13:00', location: 'Restauration', tags: ['t7'], bgColor: '#ffedd5', borderColor: '#fdba74', textColor: '#9a3412' },
                        { id: '8', title: 'Déjeuner', day: 1, startTime: '12:00', endTime: '13:00', location: 'Restauration', tags: ['t7'], bgColor: '#ffedd5', borderColor: '#fdba74', textColor: '#9a3412' },

                        // Sport & Loisirs
                        { id: '9', title: 'Séance de Fitness / Course', day: 0, startTime: '17:30', endTime: '19:00', location: 'Parc', tags: ['t4'], bgColor: '#dcfce7', borderColor: '#86efac', textColor: '#166534' },
                        { id: '10', title: 'Soirée Gaming / Cinéma', day: 0, startTime: '20:30', endTime: '23:30', location: 'Salon', tags: ['t5'], bgColor: '#ffe4e6', borderColor: '#fda4af', textColor: '#9f1239' }
                    ];

                    saveToLocalStorage();
                    isExportModalOpen.value = false;
                    showToast("Exemple 24/7 chargé avec succès !");
                };

                const loadDemo247Data = () => {
                    if (!events.value.length) { applyDemo(); return; }
                    triggerConfirm("Charger l'exemple ?", "Votre planning actuel sera remplacé par l'exemple. Exportez d'abord une sauvegarde si besoin.", applyDemo);
                };

                // Live Indicator calculation
                const updateLiveIndicator = () => {
                    const now = new Date();
                    const hours = now.getHours();
                    const minutes = now.getMinutes();
                    currentDayIndex.value = (now.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 index
                    
                    const totalFloatHours = hours + (minutes / 60);
                    liveHour.value = totalFloatHours;
                };

                // Print
                const printSchedule = () => window.print();
                const printDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

                // Fait défiler la page jusqu'à l'heure actuelle (la page est le seul défilement)
                const goNow = () => {
                    const el = document.querySelector('.pl-now') || document.querySelector('.pl-table');
                    window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4), behavior: 'smooth' });
                };


                onMounted(() => {
                    loadFromLocalStorage();

                    // Live indicator ticker
                    updateLiveIndicator();
                    timerInterval = setInterval(updateLiveIndicator, 60000);
                });

                onUnmounted(() => {
                    if (timerInterval) clearInterval(timerInterval);
                });

                return {
                    days,
                    colorPresets,
                    events,
                    tags,
                    selectedTagFilters,
                    searchQuery,
                    importMode,
                    evSize,
                    goNow,
                    printDate,
                    isModalOpen,
                    isTagModalOpen,
                    isExportModalOpen,
                    editingId,
                    confirmDialog,
                    form,
                    tagForm,
                    currentDayIndex,
                    liveHour,
                    formatHour,
                    getTagById,
                    getEventStyle,
                    filteredEventsByDay,
                    getDayTotalHours,
                    totalWeeklyHours,
                    tagStats,
                    getTagCount,
                    getTagFilterStyle,
                    toggleTagFilter,
                    openModal,
                    quickAddEvent,
                    closeModal,
                    toggleFormTag,
                    saveEvent,
                    editEvent,
                    duplicateEvent,
                    askDeleteEvent,
                    saveTag,
                    editTag,
                    resetTagForm,
                    askDeleteTag,
                    askClearAll,
                    downloadJSON,
                    importJSON,
                    loadDemo247Data,
                    printSchedule,
                    executeConfirmAction
                };
            }
        });
        /* v-dlg : ouvre la balise <dialog> en modale (focus piégé, Échap, fond) */
        app.directive('dlg', { mounted: el => el.showModal() });
        app.mount('#app');
})();
