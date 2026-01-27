const express = require('express')
const cors = require('cors')
const fs = require('fs/promises')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 8787
const DATA_DIR = path.join(__dirname, '..', 'data')

app.use(cors())
app.use(express.json({ limit: '2mb' }))

function sanitizeClientId(value) {
  if (!value || typeof value !== 'string') return ''
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, '')
}

function getClientId(req) {
  const header = req.get('X-Client-Id')
  const query = req.query?.clientId
  const clientId = sanitizeClientId(header || query)
  return clientId || ''
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

async function loadUserData(clientId) {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, `${clientId}.json`)
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return normalizeData(JSON.parse(raw))
  } catch (err) {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      transactions: [],
      categories: [],
      accounts: []
    }
  }
}

async function saveUserData(clientId, data) {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, `${clientId}.json`)
  const payload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
    accounts: Array.isArray(data?.accounts) ? data.accounts : []
  }
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')
}

function normalizeData(data) {
  return {
    version: data?.version || 1,
    updatedAt: data?.updatedAt || new Date().toISOString(),
    transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
    accounts: Array.isArray(data?.accounts) ? data.accounts : []
  }
}

function parseId(value) {
  const id = Number(value)
  return Number.isFinite(id) ? id : null
}

function nextId(items) {
  const maxId = items.reduce((max, item) => {
    const id = Number(item?.id)
    return Number.isFinite(id) && id > max ? id : max
  }, 0)
  return maxId + 1
}

function ensureIds(items) {
  let next = nextId(items)
  return items.map(item => {
    if (Number.isFinite(Number(item?.id))) {
      return item
    }
    const assigned = { ...item, id: next }
    next += 1
    return assigned
  })
}

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api', (req, res, next) => {
  const clientId = getClientId(req)
  if (!clientId) {
    res.status(400).json({ message: 'Missing X-Client-Id' })
    return
  }
  req.clientId = clientId
  next()
})

app.get('/api/v1/data', async (req, res) => {
  const data = await loadUserData(req.clientId)
  res.json(data)
})

app.put('/api/v1/data', async (req, res) => {
  const payload = normalizeData(req.body)
  await saveUserData(req.clientId, payload)
  res.json({ ok: true })
})

app.post('/api/v1/bootstrap', async (req, res) => {
  const existing = await loadUserData(req.clientId)
  if (existing.transactions.length || existing.categories.length || existing.accounts.length) {
    res.json({ initialized: false })
    return
  }

  const categories = ensureIds(
    Array.isArray(req.body?.categories) ? req.body.categories : []
  )
  const accounts = ensureIds(
    Array.isArray(req.body?.accounts) ? req.body.accounts : []
  )

  await saveUserData(req.clientId, {
    transactions: [],
    categories,
    accounts
  })

  res.json({ initialized: true })
})

app.post('/api/v1/transactions', async (req, res) => {
  const data = await loadUserData(req.clientId)
  const id = nextId(data.transactions)
  const transaction = { ...req.body, id }
  data.transactions.unshift(transaction)
  await saveUserData(req.clientId, data)
  res.json({ id })
})

app.put('/api/v1/transactions/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ message: 'Invalid id' })
    return
  }
  const data = await loadUserData(req.clientId)
  const index = data.transactions.findIndex(item => Number(item?.id) === id)
  if (index === -1) {
    res.status(404).json({ message: 'Transaction not found' })
    return
  }
  data.transactions[index] = { ...req.body, id }
  await saveUserData(req.clientId, data)
  res.json({ ok: true })
})

app.delete('/api/v1/transactions/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ message: 'Invalid id' })
    return
  }
  const data = await loadUserData(req.clientId)
  data.transactions = data.transactions.filter(item => Number(item?.id) !== id)
  await saveUserData(req.clientId, data)
  res.json({ ok: true })
})

app.post('/api/v1/categories', async (req, res) => {
  const data = await loadUserData(req.clientId)
  const id = nextId(data.categories)
  const category = { ...req.body, id }
  data.categories.push(category)
  await saveUserData(req.clientId, data)
  res.json({ id })
})

app.put('/api/v1/categories/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ message: 'Invalid id' })
    return
  }
  const data = await loadUserData(req.clientId)
  const index = data.categories.findIndex(item => Number(item?.id) === id)
  if (index === -1) {
    res.status(404).json({ message: 'Category not found' })
    return
  }
  data.categories[index] = { ...req.body, id }
  await saveUserData(req.clientId, data)
  res.json({ ok: true })
})

app.delete('/api/v1/categories/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ message: 'Invalid id' })
    return
  }
  const data = await loadUserData(req.clientId)
  data.categories = data.categories.filter(item => Number(item?.id) !== id)
  await saveUserData(req.clientId, data)
  res.json({ ok: true })
})

app.post('/api/v1/accounts', async (req, res) => {
  const data = await loadUserData(req.clientId)
  const id = nextId(data.accounts)
  const account = { ...req.body, id }
  data.accounts.push(account)
  await saveUserData(req.clientId, data)
  res.json({ id })
})

app.put('/api/v1/accounts/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ message: 'Invalid id' })
    return
  }
  const data = await loadUserData(req.clientId)
  const index = data.accounts.findIndex(item => Number(item?.id) === id)
  if (index === -1) {
    res.status(404).json({ message: 'Account not found' })
    return
  }
  data.accounts[index] = { ...req.body, id }
  await saveUserData(req.clientId, data)
  res.json({ ok: true })
})

app.delete('/api/v1/accounts/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ message: 'Invalid id' })
    return
  }
  const data = await loadUserData(req.clientId)
  data.accounts = data.accounts.filter(item => Number(item?.id) !== id)
  await saveUserData(req.clientId, data)
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Cloud storage server running on http://localhost:${PORT}`)
})
