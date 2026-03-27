import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  BarChart2,
  Film,
  Pencil,
  Plus,
  Settings,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { AdminAPI, ContentAPI } from '../../utils/api';

interface AdminSettings {
  site_settings: {
    site_name: string;
    language: string;
    maintenance_mode: boolean;
    registration_enabled: boolean;
    trial_period_days: number;
  };
  analytics_settings: {
    tracking_enabled: boolean;
    retention_days: number;
  };
}

const mockSettings: AdminSettings = {
  site_settings: {
    site_name: 'MV-STREAM',
    language: 'fr',
    maintenance_mode: false,
    registration_enabled: true,
    trial_period_days: 60,
  },
  analytics_settings: {
    tracking_enabled: true,
    retention_days: 90,
  },
};

type ContentTypeValue = 'movie' | 'series' | 'live';
type SourceTypeValue = 'upload' | 'embed' | 'hls' | 'm3u8' | 'playlist';

interface ContentFormState {
  contentType: ContentTypeValue;
  title: string;
  description: string;
  category: string;
  year: string;
  ageRating: string;
  durationMinutes: string;
  productionHouse: string;
  distribution: string;
  seasonsCount: string;
  episodesCount: string;
  sourceType: SourceTypeValue;
  streamUrl: string;
  posterFile: File | null;
  backdropFile: File | null;
  videoFile: File | null;
  m3u8File: File | null;
  playlistFile: File | null;
}

const defaultContentForm = (): ContentFormState => ({
  contentType: 'movie',
  title: '',
  description: '',
  category: '',
  year: '',
  ageRating: '',
  durationMinutes: '',
  productionHouse: '',
  distribution: '',
  seasonsCount: '',
  episodesCount: '',
  sourceType: 'upload',
  streamUrl: '',
  posterFile: null,
  backdropFile: null,
  videoFile: null,
  m3u8File: null,
  playlistFile: null,
});

function extractIframeSrc(input: string) {
  const s = (input || '').trim();
  if (!s) return '';
  if (s.toLowerCase().includes('<iframe')) {
    const m = s.match(/src\s*=\s*["']([^"']+)["']/i);
    return (m?.[1] || '').trim();
  }
  return s;
}

function numberString(value: any) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function buildContentFormData(form: ContentFormState) {
  const fd = new FormData();
  fd.append('type', form.contentType);
  fd.append('title', form.title.trim());
  fd.append('description', form.description.trim());
  fd.append('category', form.category.trim());
  fd.append('year', form.year.trim());
  fd.append('age_rating', form.ageRating.trim());
  fd.append('duration_minutes', form.durationMinutes.trim());
  fd.append('production_house', form.productionHouse.trim());
  fd.append('distribution', form.distribution.trim());
  fd.append('seasons_count', form.contentType === 'series' ? form.seasonsCount.trim() : '');
  fd.append('episodes_count', form.contentType === 'series' ? form.episodesCount.trim() : '');
  fd.append('source_type', form.sourceType === 'playlist' ? 'm3u8' : form.sourceType);

  if (form.posterFile) fd.append('poster_file', form.posterFile);
  if (form.backdropFile) fd.append('backdrop_file', form.backdropFile);
  if (form.videoFile) fd.append('video_file', form.videoFile);
  if (form.m3u8File) fd.append('m3u8_file', form.m3u8File);

  if (form.sourceType === 'embed') {
    fd.append('stream_url', extractIframeSrc(form.streamUrl));
  } else if (form.sourceType !== 'upload' && form.sourceType !== 'playlist') {
    fd.append('stream_url', form.streamUrl.trim());
  }

  return fd;
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-gray-600 bg-gray-700/70 px-3 py-2.5 text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-600 bg-gray-700/70 px-3 py-2.5 text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
      />
    </div>
  );
}

function FileField({
  label,
  accept,
  onChange,
  file,
  inputId,
  helper,
  required = false,
}: {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
  file: File | null;
  inputId: string;
  helper?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>
      <div className="rounded-2xl border-2 border-dashed border-gray-600 bg-gray-800/50 p-4">
        <input
          id={inputId}
          type="file"
          accept={accept}
          required={required}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="hidden"
        />
        <label htmlFor={inputId} className="flex cursor-pointer flex-col items-center justify-center text-center">
          <Upload className="mb-2 h-8 w-8 text-gray-400" />
          <span className="text-sm text-gray-300">Clique pour choisir un fichier</span>
          {helper ? <span className="mt-1 text-xs text-gray-500">{helper}</span> : null}
          {file ? <span className="mt-2 text-sm text-green-400">Sélectionné: {file.name}</span> : null}
        </label>
      </div>
    </div>
  );
}

function SourceSelector({ value, onChange }: { value: SourceTypeValue; onChange: (value: SourceTypeValue) => void }) {
  const options: Array<{ value: SourceTypeValue; label: string }> = [
    { value: 'upload', label: 'Upload vidéo' },
    { value: 'embed', label: 'Embed / iframe' },
    { value: 'hls', label: 'Lien HLS' },
    { value: 'm3u8', label: 'Lien/Fichier M3U8' },
    { value: 'playlist', label: 'Import M3U/M3U8' },
  ];

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">Source</label>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-xl border px-3 py-2 text-sm transition ${
              value === option.value
                ? 'border-red-500 bg-red-600 text-white'
                : 'border-gray-600 bg-gray-700/60 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContentMetaFields({ form, setForm }: { form: ContentFormState; setForm: React.Dispatch<React.SetStateAction<ContentFormState>> }) {
  const isSeries = form.contentType === 'series';
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TextField label="Catégorie" value={form.category} onChange={(value) => setForm((prev) => ({ ...prev, category: value }))} placeholder="Action, Drama, Sport..." />
        <TextField label="Année" type="number" value={form.year} onChange={(value) => setForm((prev) => ({ ...prev, year: value }))} placeholder="2026" />
        <TextField label="Âge" value={form.ageRating} onChange={(value) => setForm((prev) => ({ ...prev, ageRating: value }))} placeholder="13+, 16+, Tout public" />
        <TextField label="Durée (minutes)" type="number" value={form.durationMinutes} onChange={(value) => setForm((prev) => ({ ...prev, durationMinutes: value }))} placeholder="120" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          label="Maison de distribution"
          value={form.productionHouse}
          onChange={(value) => setForm((prev) => ({ ...prev, productionHouse: value }))}
          placeholder="Netflix Studios, A24, Canal+, ..."
        />
        <TextField
          label="Contributeurs (Casting)"
          value={form.distribution}
          onChange={(value) => setForm((prev) => ({ ...prev, distribution: value }))}
          placeholder="Nom 1, Nom 2, Nom 3"
        />
      </div>

      {isSeries && (
        <div className="rounded-2xl border border-white/8 bg-gray-700/30 p-4">
          <div className="mb-4">
            <p className="text-sm font-semibold text-white">Métadonnées de la série</p>
            <p className="text-xs text-gray-400">Sa ap ede paj détail série yo parèt plis pwofesyonèl.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              label="Nombre de saisons"
              type="number"
              value={form.seasonsCount}
              onChange={(value) => setForm((prev) => ({ ...prev, seasonsCount: value }))}
              placeholder="3"
            />
            <TextField
              label="Nombre d'épisodes"
              type="number"
              value={form.episodesCount}
              onChange={(value) => setForm((prev) => ({ ...prev, episodesCount: value }))}
              placeholder="24"
            />
          </div>
        </div>
      )}
    </>
  );
}

function ContentSourceFields({ form, setForm, editing = false }: { form: ContentFormState; setForm: React.Dispatch<React.SetStateAction<ContentFormState>>; editing?: boolean }) {
  if (form.sourceType === 'playlist' && !editing) {
    return (
      <>
        <div className="rounded-2xl border border-white/8 bg-gray-700/30 p-4">
          <p className="text-sm font-semibold text-white">Import playlist</p>
          <p className="mt-1 text-xs text-gray-400">Importe un fichier M3U/M3U8 pour ajouter des chaînes live automatiquement.</p>
        </div>
        <FileField
          label="Fichier playlist"
          accept=".m3u,.m3u8"
          file={form.playlistFile}
          onChange={(file) => setForm((prev) => ({ ...prev, playlistFile: file }))}
          inputId="playlist-upload"
          helper="Formats supportés: .m3u, .m3u8"
          required
        />
      </>
    );
  }

  return (
    <>
      {form.sourceType === 'upload' && form.contentType !== 'live' && (
        <FileField
          label="Fichier vidéo"
          accept="video/*"
          file={form.videoFile}
          onChange={(file) => setForm((prev) => ({ ...prev, videoFile: file }))}
          inputId={editing ? 'video-edit' : 'video-upload'}
          required={!editing}
        />
      )}

      {form.sourceType === 'embed' && (
        <TextAreaField
          label="Lien embed ou code iframe"
          value={form.streamUrl}
          onChange={(value) => setForm((prev) => ({ ...prev, streamUrl: value }))}
          rows={4}
          placeholder={`https://site.com/embed/123\n\nOU\n<iframe src="https://site.com/embed/123"></iframe>`}
        />
      )}

      {form.sourceType === 'hls' && (
        <TextField
          label="Lien HLS (.m3u8)"
          value={form.streamUrl}
          onChange={(value) => setForm((prev) => ({ ...prev, streamUrl: value }))}
          placeholder="https://example.com/live/playlist.m3u8"
        />
      )}

      {form.sourceType === 'm3u8' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            label="Lien M3U8"
            value={form.streamUrl}
            onChange={(value) => setForm((prev) => ({ ...prev, streamUrl: value }))}
            placeholder="https://example.com/playlist.m3u8"
          />
          <FileField
            label="Fichier M3U8"
            accept=".m3u8"
            file={form.m3u8File}
            onChange={(file) => setForm((prev) => ({ ...prev, m3u8File: file }))}
            inputId={editing ? 'm3u8-edit' : 'm3u8-upload'}
            helper="Optionnel si ou deja gen lien an"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FileField
          label="Poster"
          accept="image/*"
          file={form.posterFile}
          onChange={(file) => setForm((prev) => ({ ...prev, posterFile: file }))}
          inputId={editing ? 'poster-edit' : 'poster-upload'}
          helper={editing ? 'Optionnel si ou pa bezwen chanje l' : 'Image principale du contenu'}
          required={!editing}
        />
        <FileField
          label="Backdrop / cover large"
          accept="image/*"
          file={form.backdropFile}
          onChange={(file) => setForm((prev) => ({ ...prev, backdropFile: file }))}
          inputId={editing ? 'backdrop-edit' : 'backdrop-upload'}
          helper="Sa a sèvi pou gwo hero image sou page détail la"
        />
      </div>
    </>
  );
}

function ContentModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[1.8rem] border border-white/10 bg-gray-800 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-gray-800/95 px-6 py-4 backdrop-blur">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-full bg-white/6 p-2 text-gray-300 transition hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const ContentModal: React.FC<ContentModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState<ContentFormState>(defaultContentForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setForm(defaultContentForm());
      setSubmitting(false);
      setSubmitError(null);
      setSubmitOk(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitOk(null);

    if (form.sourceType === 'playlist') {
      if (!form.playlistFile) {
        setSubmitError('Fichier M3U/M3U8 requis');
        return;
      }
      try {
        setSubmitting(true);
        const fd = new FormData();
        fd.append('playlist_file', form.playlistFile);
        const res = await AdminAPI.importPlaylist(fd);
        setSubmitOk(`Import terminé. Créé: ${res.created} | Ignoré: ${res.skipped}`);
        onCreated?.();
        setTimeout(() => onClose(), 800);
      } catch (err: any) {
        setSubmitError(err?.message || 'Échec de l’import playlist');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!form.title.trim()) {
      setSubmitError('Titre requis');
      return;
    }
    if (!form.posterFile) {
      setSubmitError('Poster requis');
      return;
    }
    if (form.contentType === 'live' && form.sourceType === 'upload') {
      setSubmitError('Un contenu live doit utiliser un lien de stream');
      return;
    }
    if (form.sourceType === 'upload' && form.contentType !== 'live' && !form.videoFile) {
      setSubmitError('Fichier vidéo requis');
      return;
    }
    if (form.sourceType === 'embed' && !extractIframeSrc(form.streamUrl)) {
      setSubmitError('Lien embed ou iframe requis');
      return;
    }
    if ((form.sourceType === 'hls' || (form.sourceType === 'm3u8' && !form.m3u8File)) && !form.streamUrl.trim()) {
      setSubmitError('Lien de stream requis');
      return;
    }

    try {
      setSubmitting(true);
      const fd = buildContentFormData(form);
      await AdminAPI.createContent(fd);
      setSubmitOk('Contenu ajouté avec succès');
      onCreated?.();
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setSubmitError(err?.message || 'Échec de création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContentModalShell title="Ajouter un contenu" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="flex items-center rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mr-2 h-4 w-4" />
            {submitError}
          </div>
        )}
        {submitOk && <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">{submitOk}</div>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Type</label>
            <select
              value={form.contentType}
              onChange={(e) => setForm((prev) => ({ ...prev, contentType: e.target.value as ContentTypeValue }))}
              className="w-full rounded-xl border border-gray-600 bg-gray-700/70 px-3 py-2.5 text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
            >
              <option value="movie">Film</option>
              <option value="series">Série</option>
              <option value="live">Live TV</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <TextField label="Titre" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} required />
          </div>
        </div>

        <TextAreaField
          label="Synopsis"
          value={form.description}
          onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
          rows={4}
          placeholder="Synopsis, résumé, contexte..."
        />

        <ContentMetaFields form={form} setForm={setForm} />
        <SourceSelector
          value={form.sourceType}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              sourceType: value,
              contentType: value === 'playlist' ? 'live' : prev.contentType,
            }))
          }
        />
        <ContentSourceFields form={form} setForm={setForm} />

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 transition hover:text-white">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-red-600 px-6 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (form.sourceType === 'playlist' ? 'Importing…' : 'Ajout…') : form.sourceType === 'playlist' ? 'Importer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </ContentModalShell>
  );
};

interface EditContentModalProps {
  isOpen: boolean;
  item: any | null;
  onClose: () => void;
  onSaved?: (updated: any) => void;
}

const EditContentModal: React.FC<EditContentModalProps> = ({ isOpen, item, onClose, onSaved }) => {
  const [form, setForm] = useState<ContentFormState>(defaultContentForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      setForm({
        contentType: (item.type as ContentTypeValue) || 'movie',
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        year: numberString(item.year),
        ageRating: item.age_rating || '',
        durationMinutes: numberString(item.duration_minutes),
        productionHouse: item.production_house || '',
        distribution: item.distribution || '',
        seasonsCount: numberString(item.seasons_count),
        episodesCount: numberString(item.episodes_count),
        sourceType: (item.source_type as SourceTypeValue) || 'upload',
        streamUrl: item.video_url || '',
        posterFile: null,
        backdropFile: null,
        videoFile: null,
        m3u8File: null,
        playlistFile: null,
      });
      setSubmitting(false);
      setSubmitError(null);
      setSubmitOk(null);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitOk(null);

    if (!form.title.trim()) {
      setSubmitError('Titre requis');
      return;
    }
    if (form.contentType === 'live' && form.sourceType === 'upload' && !form.videoFile) {
      setSubmitError('Un contenu live doit utiliser un lien de stream');
      return;
    }
    if (form.sourceType === 'embed' && form.streamUrl.trim() && !extractIframeSrc(form.streamUrl)) {
      setSubmitError('Iframe ou lien embed invalide');
      return;
    }

    try {
      setSubmitting(true);
      const fd = buildContentFormData(form);
      const res = await AdminAPI.updateContent(item.id, fd);
      setSubmitOk('Modifications enregistrées');
      onSaved?.(res.item);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setSubmitError(err?.message || 'Échec de mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContentModalShell title="Modifier le contenu" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="flex items-center rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mr-2 h-4 w-4" />
            {submitError}
          </div>
        )}
        {submitOk && <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">{submitOk}</div>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Type</label>
            <select
              value={form.contentType}
              onChange={(e) => setForm((prev) => ({ ...prev, contentType: e.target.value as ContentTypeValue }))}
              className="w-full rounded-xl border border-gray-600 bg-gray-700/70 px-3 py-2.5 text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
            >
              <option value="movie">Film</option>
              <option value="series">Série</option>
              <option value="live">Live TV</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <TextField label="Titre" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} required />
          </div>
        </div>

        <TextAreaField label="Description" value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: value }))} rows={4} />

        <ContentMetaFields form={form} setForm={setForm} />
        <SourceSelector value={form.sourceType} onChange={(value) => setForm((prev) => ({ ...prev, sourceType: value === 'playlist' ? 'm3u8' : value }))} />
        <ContentSourceFields form={form} setForm={setForm} editing />

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 transition hover:text-white">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-red-600 px-6 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </ContentModalShell>
  );
};

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setEmail('');
      setRole('user');
      setPassword('');
      setSubmitting(false);
      setSubmitError(null);
      setSubmitOk(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitOk(null);
    if (password.trim().length < 6) {
      setSubmitError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setSubmitting(true);
      await AdminAPI.createUser({ full_name: name, email, password, role });
      setSubmitOk('Utilisateur créé');
      onCreated?.();
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setSubmitError(err?.message || 'Échec de création utilisateur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContentModalShell title="Ajouter un utilisateur" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        {submitError && (
          <div className="flex items-center rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mr-2 h-4 w-4" />
            {submitError}
          </div>
        )}
        {submitOk && <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">{submitOk}</div>}

        <TextField label="Nom complet" value={name} onChange={setName} required />
        <TextField label="Email" type="email" value={email} onChange={setEmail} required />

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Rôle</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
            className="w-full rounded-xl border border-gray-600 bg-gray-700/70 px-3 py-2.5 text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <TextField label="Mot de passe" type="password" value={password} onChange={setPassword} required />

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 transition hover:text-white">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-red-600 px-6 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Ajout…' : 'Ajouter'}
          </button>
        </div>
      </form>
    </ContentModalShell>
  );
};

const ImportJsonModal: React.FC<ContentModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setSubmitting(false);
      setSubmitError(null);
      setSubmitOk(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setSubmitError('Veuillez choisir un fichier JSON');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      const fd = new FormData();
      fd.append('json_file', file);
      const res = await AdminAPI.importJson(fd);
      setSubmitOk(`Importation réussie : ${res.created} créés${res.skipped ? `, ${res.skipped} ignorés (doublons)` : ''}.`);
      onCreated?.();
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setSubmitError(err?.message || 'Échec de l\'importation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContentModalShell title="Injecter un fichier JSON" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="flex items-center rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mr-2 h-4 w-4" />
            {submitError}
          </div>
        )}
        {submitOk && <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">{submitOk}</div>}

        <div className="rounded-2xl border border-white/8 bg-gray-700/30 p-4">
          <p className="text-sm font-semibold text-white">Importation en masse</p>
          <p className="mt-1 text-xs text-gray-400">
            Choisissez un fichier .json contenant une liste d'objets avec les champs suivants :
            title, description (synopsis), type, year, age_rating, duration_minutes, production_house, distribution (contributeurs), etc.
          </p>
        </div>

        <FileField
          label="Fichier JSON"
          accept=".json"
          file={file}
          onChange={setFile}
          inputId="json-import-upload"
          helper="Le fichier doit être au format JSON valide."
          required
        />

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 transition hover:text-white">
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-red-600 px-6 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Importation...' : 'Lancer l\'injection'}
          </button>
        </div>
      </form>
    </ContentModalShell>
  );
};

const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isImportJsonModalOpen, setIsImportJsonModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [contents, setContents] = useState<any[]>([]);
  const [contentsLoading, setContentsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettings(mockSettings);
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const a = await AdminAPI.analytics();
      setAnalytics(a);
    } catch (e: any) {
      setAnalytics(null);
      setError(e?.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadContents = async () => {
    try {
      setContentsLoading(true);
      const res = await ContentAPI.list();
      setContents(res.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load content');
    } finally {
      setContentsLoading(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await AdminAPI.deleteContent(deleteTarget.id);
      setContents((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
      loadAnalytics();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete content');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    loadContents();
  }, []);

  const stats = useMemo(() => {
    const movies = contents.filter((item) => item.type === 'movie').length;
    const series = contents.filter((item) => item.type === 'series').length;
    const live = contents.filter((item) => item.type === 'live').length;
    return { movies, series, live };
  }, [contents]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="ml-4 rounded-full p-1 hover:bg-red-500/20">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('admin.dashboard')}</h1>
          <p className="mt-2 text-sm text-gray-400">
            Kounye a dashboard la pèmèt ou antre manyèlman: maison de production, distribution, backdrop, ak metadata série yo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsContentModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-white transition hover:bg-red-700">
            <Plus className="h-4 w-4" />
            Ajouter un contenu
          </button>
          <button onClick={() => setIsImportJsonModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white transition hover:bg-white/10">
            <Upload className="h-4 w-4" />
            Injecter JSON
          </button>
          <button onClick={() => setIsUserModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white transition hover:bg-white/10">
            <Users className="h-4 w-4" />
            Ajouter un user
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.6rem] border border-white/8 bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Film className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Gestion contenu</h2>
          </div>
          <p className="text-sm text-gray-400">Ajoute films, séries, live, posters, backdrops, maison de production et distribution.</p>
        </div>

        <div className="rounded-[1.6rem] border border-white/8 bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Statistiques locales</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-xl bg-gray-700/60 p-3">
              <div className="text-gray-400">Films</div>
              <div className="mt-1 text-xl font-bold text-white">{stats.movies}</div>
            </div>
            <div className="rounded-xl bg-gray-700/60 p-3">
              <div className="text-gray-400">Séries</div>
              <div className="mt-1 text-xl font-bold text-white">{stats.series}</div>
            </div>
            <div className="rounded-xl bg-gray-700/60 p-3">
              <div className="text-gray-400">Live</div>
              <div className="mt-1 text-xl font-bold text-white">{stats.live}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-white/8 bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Utilisateurs</h2>
          </div>
          <p className="text-sm text-gray-400">Total users: <span className="text-white">{analytics?.totals?.users ?? '—'}</span></p>
          <p className="mt-2 text-sm text-gray-400">Nouveaux 7 jours: <span className="text-white">{analytics?.totals?.new_users_7d ?? '—'}</span></p>
        </div>

        <div className="rounded-[1.6rem] border border-white/8 bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Paramètres</h2>
          </div>
          {settings && (
            <div className="space-y-2 text-sm text-gray-400">
              <p>Nom du site: <span className="text-white">{settings.site_settings.site_name}</span></p>
              <p>Période essai: <span className="text-white">{settings.site_settings.trial_period_days} jours</span></p>
              <p>Langue: <span className="text-white">{settings.site_settings.language}</span></p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-[1.8rem] border border-white/8 bg-gray-800 p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Bibliothèque</h2>
            <p className="mt-1 text-sm text-gray-400">Tu peux modifier directement les métadonnées premium de chaque contenu.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadAnalytics}
              disabled={analyticsLoading}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-60"
            >
              {analyticsLoading ? 'Refreshing…' : 'Refresh analytics'}
            </button>
            <button
              onClick={loadContents}
              disabled={contentsLoading}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-60"
            >
              {contentsLoading ? 'Chargement…' : 'Rafraîchir contenus'}
            </button>
          </div>
        </div>

        {contentsLoading ? (
          <div className="text-sm text-gray-400">Chargement…</div>
        ) : contents.length === 0 ? (
          <div className="text-sm text-gray-400">Aucun contenu trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-gray-400">
                  <th className="py-3 pr-3">Titre</th>
                  <th className="py-3 pr-3">Type</th>
                  <th className="py-3 pr-3">Catégorie</th>
                  <th className="py-3 pr-3">Maison</th>
                  <th className="py-3 pr-3">Distribution</th>
                  <th className="py-3 pr-3">ID</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {contents.map((content) => (
                  <tr key={content.id} className="border-b border-white/6 text-gray-200">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-white">{content.title}</div>
                      <div className="text-xs text-gray-500">{content.year || '—'} {content.age_rating ? `• ${content.age_rating}` : ''}</div>
                    </td>
                    <td className="py-3 pr-3 capitalize">{content.type}</td>
                    <td className="py-3 pr-3">{content.category || '—'}</td>
                    <td className="py-3 pr-3">{content.production_house || '—'}</td>
                    <td className="max-w-[220px] py-3 pr-3 text-gray-300">
                      <span className="line-clamp-2">{content.distribution || '—'}</span>
                    </td>
                    <td className="py-3 pr-3 text-gray-400">{content.id}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditTarget(content)}
                          className="inline-flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-white transition hover:bg-gray-600"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(content)}
                          className="rounded-lg bg-red-600 px-3 py-2 text-white transition hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ContentModal
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
        onCreated={() => {
          loadAnalytics();
          loadContents();
        }}
      />

      <EditContentModal
        isOpen={!!editTarget}
        item={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={(updated) => {
          setContents((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
          loadAnalytics();
        }}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onCreated={() => loadAnalytics()}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.6rem] border border-white/10 bg-gray-800 p-6">
            <h3 className="text-xl font-semibold text-white">Confirm deletion</h3>
            <p className="mt-2 text-sm text-gray-300">
              Ou prèt pou efase <span className="font-semibold text-white">{deleteTarget.title}</span> ?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-gray-300 transition hover:text-white" disabled={deleting}>
                Cancel
              </button>
              <button onClick={doDelete} disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ImportJsonModal
        isOpen={isImportJsonModalOpen}
        onClose={() => setIsImportJsonModalOpen(false)}
        onCreated={() => {
          loadAnalytics();
          loadContents();
        }}
      />
    </div>
  );
};

export default AdminDashboardPage;
