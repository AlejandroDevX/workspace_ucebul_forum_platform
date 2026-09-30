import { useEffect } from 'react'

// ucebul_mui renderiza las opciones de Select y las pestañas de Tabs como <li>/<div> con solo onClick,
// y Dialog/Modal no mueven el foco ni cierran con Escape. Este hook no reemplaza esos componentes:
// añade foco, roles ARIA y teclado sobre su marcado para que se puedan usar sin ratón.
const OPTION = '.select__list__option:not(.select__list__option--search)'
const TAB = '.tabs__tab'
const OVERLAY_CANCEL = '.dialog__footer button:first-child, .modal__header__close'

function enhance(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('.select__list').forEach((list) => list.setAttribute('role', 'listbox'))
  root.querySelectorAll<HTMLElement>(OPTION).forEach((option) => {
    option.setAttribute('role', 'option')
    option.tabIndex = 0
    option.setAttribute('aria-selected', String(option.classList.contains('select__list__option--selected')))
  })
  root.querySelectorAll<HTMLElement>('.tabs').forEach((tabs) => tabs.setAttribute('role', 'tablist'))
  root.querySelectorAll<HTMLElement>(TAB).forEach((tab) => {
    const selected = tab.classList.contains('tabs__tab--active')
    tab.setAttribute('role', 'tab')
    tab.setAttribute('aria-selected', String(selected))
    tab.tabIndex = selected ? 0 : -1
  })
}

function moveFocus(current: HTMLElement, selector: string, step: number) {
  const siblings = [...(current.parentElement?.querySelectorAll<HTMLElement>(`:scope > ${selector}`) ?? [])]
  const index = siblings.indexOf(current)
  const next = siblings[(index + step + siblings.length) % siblings.length]
  next?.focus()
  return next
}

export function useKeyboardSupport() {
  useEffect(() => {
    enhance(document)
    const focused = new WeakSet<Element>()
    const observer = new MutationObserver(() => {
      enhance(document)
      // Al abrirse un Dialog o Modal, el foco pasa a su botón de cancelar/cerrar.
      document.querySelectorAll<HTMLElement>('.dialog-container, .modal-container').forEach((overlay) => {
        if (focused.has(overlay)) return
        focused.add(overlay)
        overlay.querySelector<HTMLElement>(OVERLAY_CANCEL)?.focus()
      })
    })
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null
      if (!target) return
      const activate = event.key === 'Enter' || event.key === ' '

      if (event.key === 'Escape') {
        const overlay = document.querySelector<HTMLElement>('.dialog-container, .modal-container')
        const cancel = overlay?.querySelector<HTMLElement>(OVERLAY_CANCEL)
        if (cancel) {
          event.preventDefault()
          cancel.click()
          return
        }
        const select = target.closest('.select')
        if (select?.querySelector('.select__list')) {
          event.preventDefault()
          const button = select.querySelector<HTMLElement>('.select__button')
          button?.click()
          button?.focus()
        }
        return
      }

      if (target.matches(OPTION)) {
        if (activate) {
          event.preventDefault()
          const button = target.closest('.select')?.querySelector<HTMLElement>('.select__button')
          target.click()
          button?.focus()
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          moveFocus(target, OPTION, event.key === 'ArrowDown' ? 1 : -1)
        }
        return
      }

      if (target.matches('.select__button') && event.key === 'ArrowDown') {
        const list = target.closest('.select')?.querySelector('.select__list')
        const option = list?.querySelector<HTMLElement>('.select__list__option--selected') ?? list?.querySelector<HTMLElement>(OPTION)
        if (option) {
          event.preventDefault()
          option.focus()
        }
        return
      }

      if (target.matches(TAB)) {
        if (activate) {
          event.preventDefault()
          target.click()
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault()
          moveFocus(target, TAB, event.key === 'ArrowRight' ? 1 : -1)?.click()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      observer.disconnect()
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
