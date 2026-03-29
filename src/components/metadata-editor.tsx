import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Braces } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { MetadataConstruct, MetadataField } from '@/types'

interface MetadataEditorProps {
  metadata: MetadataConstruct
  onChange: (metadata: MetadataConstruct) => void
}

export function MetadataEditor({ metadata, onChange }: MetadataEditorProps) {
  const [expanded, setExpanded] = useState(true)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const updateField = (index: number, updates: Partial<MetadataField>) => {
    const newFields = [...metadata.fields]
    newFields[index] = { ...newFields[index], ...updates }
    onChange({ ...metadata, fields: newFields })
  }

  const addField = () => {
    const newField: MetadataField = {
      fieldName: '',
      jsonPath: '',
      description: '',
      type: 'string',
    }
    onChange({ ...metadata, fields: [...metadata.fields, newField] })
    setEditingIndex(metadata.fields.length)
  }

  const removeField = (index: number) => {
    onChange({ ...metadata, fields: metadata.fields.filter((_, i) => i !== index) })
    if (editingIndex === index) setEditingIndex(null)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Braces className="w-4 h-4 text-primary" />
              Metadata Construct
            </CardTitle>
            <CardDescription className="mt-1">
              Define fields to extract from the PDF
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Schema Name</label>
                <input
                  type="text"
                  value={metadata.name}
                  onChange={(e) => onChange({ ...metadata, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Version</label>
                <input
                  type="text"
                  value={metadata.version}
                  onChange={(e) => onChange({ ...metadata, version: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Fields ({metadata.fields.length})
              </span>
              <Button variant="outline" size="sm" onClick={addField} className="gap-1">
                <Plus className="w-3 h-3" /> Add Field
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {metadata.fields.map((field, idx) => (
                <div
                  key={idx}
                  className={`group border rounded-lg p-3 transition-all duration-200 hover:shadow-sm ${
                    editingIndex === idx ? 'ring-2 ring-primary/20 border-primary' : ''
                  }`}
                  onClick={() => setEditingIndex(idx)}
                >
                  {editingIndex === idx ? (
                    <div className="space-y-2 animate-fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Field Name"
                          value={field.fieldName}
                          onChange={(e) => updateField(idx, { fieldName: e.target.value })}
                          className="px-2.5 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <input
                          type="text"
                          placeholder="JSON Path (e.g., agreement.id)"
                          value={field.jsonPath}
                          onChange={(e) => updateField(idx, { jsonPath: e.target.value })}
                          className="px-2.5 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-[1fr,auto] gap-2">
                        <input
                          type="text"
                          placeholder="Description"
                          value={field.description}
                          onChange={(e) => updateField(idx, { description: e.target.value })}
                          className="px-2.5 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateField(idx, { type: e.target.value as MetadataField['type'] })}
                          className="px-2.5 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="boolean">Boolean</option>
                          <option value="object">Object</option>
                          <option value="array">Array</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {field.fieldName || 'Untitled Field'}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2 font-mono">
                            {field.jsonPath || 'no path'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {field.type}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeField(idx) }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
