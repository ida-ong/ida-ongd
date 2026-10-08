import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'

const emptyOptions = { provinces: [], localities: [], communes: [], quartiers: [], roads: [], ruralUnits: [], groupements: [], villages: [] }
const emptyValue = { geo_province_id: '', geo_locality_id: '', geo_commune_id: '', geo_quartier_id: '', geo_road_id: '', geo_rural_unit_id: '', geo_groupement_id: '', geo_village_id: '' }

export default function GeoLocationFields({ value = emptyValue, onChange, errors = {} }) {
  const [options, setOptions] = useState(emptyOptions)
  const [localityType, setLocalityType] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    supabase.from('ida_geo_provinces').select('id,name').eq('is_active', true).order('name')
      .then(({ data, error }) => {
        if (!active) return
        if (error) setNotice('La liste géographique ne peut pas être chargée. Appliquez la migration géographique et rechargez le schéma Supabase.')
        else setOptions((current) => ({ ...current, provinces: data ?? [] }))
      })
    return () => { active = false }
  }, [])

  function changeField(field, nextValue) {
    onChange({ ...value, [field]: nextValue })
  }

  async function chooseProvince(event) {
    const provinceId = event.target.value
    onChange({ ...emptyValue, geo_province_id: provinceId })
    setLocalityType('')
    setNotice('')
    setOptions((current) => ({ ...emptyOptions, provinces: current.provinces }))
    if (!provinceId) return
    setLoading(true)
    const { data, error } = await supabase.from('ida_geo_localities').select('id,name,locality_type').eq('province_id', provinceId).eq('is_active', true).order('name')
    setLoading(false)
    if (error) setNotice(error.message)
    else setOptions((current) => ({ ...current, localities: data ?? [] }))
  }

  async function chooseLocality(event) {
    const localityId = event.target.value
    const locality = options.localities.find((item) => item.id === localityId)
    setLocalityType(locality?.locality_type ?? '')
    onChange({ ...emptyValue, geo_province_id: value.geo_province_id, geo_locality_id: localityId })
    setOptions((current) => ({ ...current, communes: [], quartiers: [], roads: [], ruralUnits: [], groupements: [], villages: [] }))
    if (!localityId || !locality) return
    setLoading(true)
    const isCity = locality.locality_type === 'city'
    const { data, error } = await supabase.from(isCity ? 'ida_geo_communes' : 'ida_geo_rural_units')
      .select(isCity ? 'id,name' : 'id,name,unit_type,verification_status')
      .eq(isCity ? 'locality_id' : 'territory_id', localityId).eq('is_active', true).order('name')
    setLoading(false)
    if (error) setNotice(error.message)
    else setOptions((current) => ({ ...current, [isCity ? 'communes' : 'ruralUnits']: data ?? [] }))
  }

  async function chooseCommune(event) {
    const communeId = event.target.value
    onChange({ ...value, geo_commune_id: communeId, geo_quartier_id: '', geo_road_id: '' })
    setOptions((current) => ({ ...current, quartiers: [], roads: [] }))
    if (!communeId) return
    setLoading(true)
    const { data, error } = await supabase.from('ida_geo_quartiers').select('id,name,verification_status').eq('commune_id', communeId).eq('is_active', true).neq('verification_status', 'rejected').order('name')
    setLoading(false)
    if (error) setNotice(error.message)
    else setOptions((current) => ({ ...current, quartiers: data ?? [] }))
  }

  async function chooseQuartier(event) {
    const quartierId = event.target.value
    onChange({ ...value, geo_quartier_id: quartierId, geo_road_id: '' })
    setOptions((current) => ({ ...current, roads: [] }))
    if (!quartierId) return
    setLoading(true)
    const { data, error } = await supabase.from('ida_geo_roads').select('id,name').eq('quartier_id', quartierId).eq('is_active', true).eq('verification_status', 'verified').order('name')
    setLoading(false)
    if (error) setNotice(error.message)
    else setOptions((current) => ({ ...current, roads: data ?? [] }))
  }

  async function chooseRuralUnit(event) {
    const unitId = event.target.value
    onChange({ ...value, geo_rural_unit_id: unitId, geo_groupement_id: '', geo_village_id: '' })
    setOptions((current) => ({ ...current, groupements: [], villages: [] }))
    if (!unitId) return
    setLoading(true)
    const { data, error } = await supabase.from('ida_geo_groupements').select('id,name,verification_status').eq('rural_unit_id', unitId).eq('is_active', true).neq('verification_status', 'rejected').order('name')
    setLoading(false)
    if (error) setNotice(error.message)
    else setOptions((current) => ({ ...current, groupements: data ?? [] }))
  }

  async function chooseGroupement(event) {
    const groupId = event.target.value
    onChange({ ...value, geo_groupement_id: groupId, geo_village_id: '' })
    setOptions((current) => ({ ...current, villages: [] }))
    if (!groupId) return
    setLoading(true)
    const { data, error } = await supabase.from('ida_geo_villages').select('id,name,verification_status').eq('groupement_id', groupId).eq('is_active', true).neq('verification_status', 'rejected').order('name')
    setLoading(false)
    if (error) setNotice(error.message)
    else setOptions((current) => ({ ...current, villages: data ?? [] }))
  }

  const field = (label, name, items, handler, placeholder = 'Sélectionner (facultatif)', suffix = '') => <label className="form-field geo-field" key={name}>
    <span>{label}{suffix && <small className="geo-unverified-label"> {suffix}</small>}</span>
    <select name={name} value={value[name] ?? ''} onChange={handler} disabled={loading && items.length === 0}>
      <option value="">{loading && items.length === 0 ? 'Chargement…' : placeholder}</option>
      {items.map((item) => <option value={item.id} key={item.id}>{item.name}{item.verification_status === 'needs_review' ? ' · à vérifier' : ''}{item.unit_type ? ` (${item.unit_type})` : ''}</option>)}
    </select>
    {errors[name] && <small className="field-error">{errors[name]}</small>}
  </label>

  const selectedLocality = options.localities.find((item) => item.id === value.geo_locality_id)
  const selectedQuartier = options.quartiers.find((item) => item.id === value.geo_quartier_id)

  return <section className="geo-location-fields" aria-label="Localisation géographique">
    <div className="geo-location-heading"><MapPin size={17} /><strong>Localisation</strong><span>Facultatif — vous pouvez compléter les niveaux disponibles.</span></div>
    <div className="geo-location-grid">
      {field('Province', 'geo_province_id', options.provinces, chooseProvince, 'Choisir une province')}
      {field('Ville ou territoire', 'geo_locality_id', options.localities, chooseLocality, 'Choisir une ville ou un territoire')}
      {localityType === 'city' && field('Commune', 'geo_commune_id', options.communes, chooseCommune, 'Choisir une commune')}
      {localityType === 'city' && value.geo_commune_id && field('Quartier', 'geo_quartier_id', options.quartiers, chooseQuartier, 'Choisir un quartier', 'Les entrées « à vérifier » doivent être confirmées par IDA.')}
      {localityType === 'city' && value.geo_quartier_id && <label className="form-field geo-field"><span>Avenue ou rue</span><select name="geo_road_id" value={value.geo_road_id} onChange={(event) => changeField('geo_road_id', event.target.value)} disabled={!options.roads.length}><option value="">{options.roads.length ? 'Choisir une avenue (facultatif)' : 'Aucune avenue vérifiée pour ce quartier'}</option>{options.roads.map((road) => <option value={road.id} key={road.id}>{road.name}</option>)}</select></label>}
      {localityType === 'territory' && field('Secteur ou chefferie', 'geo_rural_unit_id', options.ruralUnits, chooseRuralUnit, 'Choisir (facultatif)', 'Dénomination à confirmer.')}
      {localityType === 'territory' && value.geo_rural_unit_id && field('Groupement', 'geo_groupement_id', options.groupements, chooseGroupement, 'Choisir (facultatif)', 'Dénomination à confirmer.')}
      {localityType === 'territory' && value.geo_groupement_id && field('Village', 'geo_village_id', options.villages, (event) => changeField('geo_village_id', event.target.value), 'Choisir (facultatif)', 'Dénomination à confirmer.')}
    </div>
    {(selectedQuartier?.verification_status === 'needs_review' || options.ruralUnits.some((item) => item.id === value.geo_rural_unit_id && item.verification_status === 'needs_review')) && <p className="geo-review-note" role="status">Cette subdivision est enregistrée comme donnée à vérifier. IDA pourra la valider dans le référentiel avant de l’utiliser comme source officielle.</p>}
    {notice && <p className="field-error" role="alert">{notice}</p>}
    {selectedLocality?.locality_type === 'city' && value.geo_quartier_id && options.roads.length === 0 && <p className="geo-review-note">Aucune rue n’est encore validée pour ce quartier. N’en choisissez pas une autre commune : laissez ce champ vide pour le moment.</p>}
  </section>
}
