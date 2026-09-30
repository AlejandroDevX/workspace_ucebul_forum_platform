import { Button, DataIcons, Field, Form, type FormOption } from 'ucebul_mui'
import SearchInput, { SEARCH_MAX_LENGTH } from './SearchInput'

export interface SelectFilter {
  id: string
  label: string
  // Memoizar: Field select reinicia la selección si cambia la referencia de items.
  items: FormOption[]
  value: string | number
  onChange: (value: string) => void
  disabled?: boolean
}

interface Props {
  label: string
  search: { id: string; label: string; value: string; placeholder?: string; onSearch: (value: string) => void }
  selects: SelectFilter[]
  hasFilters: boolean
  onClear: () => void
}

// Texto con debounce y selects que se aplican al elegir. Enter aplica el texto sin esperar.
export default function SearchFilters({ label, search, selects, hasFilters, onClear }: Props) {
  function submit(values: Record<string, unknown>) {
    const text = String(values[search.id] ?? '').trim()
    if (text !== search.value && text.length <= SEARCH_MAX_LENGTH) search.onSearch(text)
  }

  return (
    <div role="search" aria-label={label}>
      <Form className="catalog-filters" onSubmit={submit}>
        <SearchInput id={search.id} label={search.label} value={search.value} placeholder={search.placeholder} onSearch={search.onSearch} />
        {selects.map((select) => (
          <Field key={select.id} id={select.id} name={select.id} label={select.label} component="select"
            items={select.items} value={select.value} disabled={select.disabled}
            onChange={(option: FormOption) => select.onChange(String(option.value ?? ''))} />
        ))}
        <div className="catalog-filters__actions">
          {hasFilters && <Button variant="default" onClick={onClear}>
            <span className="button-icon" aria-hidden="true">{DataIcons.buttons.close}</span>Limpiar</Button>}
        </div>
      </Form>
    </div>
  )
}
