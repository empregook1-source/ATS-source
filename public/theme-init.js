(function () {
  try {
    if (localStorage.getItem('matrix-color-mode') === 'dark') {
      document.documentElement.classList.add('dark')
    }
  } catch {}
}())
