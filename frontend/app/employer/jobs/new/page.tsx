'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { jobsApi } from '@/lib/api'
import { ArrowLeft, Plus, X, GripVertical } from 'lucide-react'

interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'file'
  label: string
  required: boolean
  options?: string[]
}

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    company_name: '',
    location: '',
    job_type: 'Full-time',
    salary_range: '',
    status: 'draft'
  })

  const [formFields, setFormFields] = useState<FormField[]>([
    { id: '1', type: 'text', label: 'Full Name', required: true },
    { id: '2', type: 'email', label: 'Email', required: true },
    { id: '3', type: 'file', label: 'Resume', required: true },
  ])

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'select', label: 'Dropdown' },
    { value: 'file', label: 'File Upload' },
  ]

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: 'text',
      label: 'New Field',
      required: false
    }
    setFormFields([...formFields, newField])
  }

  const removeField = (id: string) => {
    setFormFields(formFields.filter(f => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFormFields(formFields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const handleSubmit = async (publish: boolean = false) => {
    setError('')
    setLoading(true)

    if (!jobData.title) {
      setError('Job title is required')
      setLoading(false)
      return
    }

    try {
      const payload = {
        ...jobData,
        status: publish ? 'published' : 'draft',
        form_schema: { fields: formFields }
      }

      const response = await jobsApi.create(payload)
      router.push(`/employer/jobs/${response.data.job.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Create New Job</h1>
          <p className="text-gray-600 mt-2">Fill in job details and customize the application form</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
                <CardDescription>Basic information about the position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Senior Full Stack Developer"
                    value={jobData.title}
                    onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="Your company name"
                    value={jobData.company_name}
                    onChange={(e) => setJobData({ ...jobData, company_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. San Francisco, CA or Remote"
                    value={jobData.location}
                    onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="job_type">Job Type</Label>
                  <select
                    id="job_type"
                    value={jobData.job_type}
                    onChange={(e) => setJobData({ ...jobData, job_type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input
                    id="salary"
                    placeholder="e.g. $80k - $120k"
                    value={jobData.salary_range}
                    onChange={(e) => setJobData({ ...jobData, salary_range: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    placeholder="Describe the role, responsibilities, and requirements..."
                    value={jobData.description}
                    onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Builder */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Application Form</CardTitle>
                    <CardDescription>Customize fields for applicants</CardDescription>
                  </div>
                  <Button size="sm" onClick={addField}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {formFields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <GripVertical className="w-5 h-5 text-gray-400 mt-2 cursor-move" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            placeholder="Field label"
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            className="flex-1 mr-2"
                          />
                          <button
                            onClick={() => removeField(field.id)}
                            className="p-2 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                          >
                            {fieldTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          
                          <label className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="rounded border-gray-300"
                            />
                            <span>Required</span>
                          </label>
                        </div>

                        {field.type === 'select' && (
                          <Input
                            placeholder="Options (comma separated)"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateField(field.id, { 
                              options: e.target.value.split(',').map(o => o.trim()) 
                            })}
                            className="text-sm"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Form Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formFields.map(field => (
                  <div key={field.id}>
                    <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                    {field.type === 'textarea' ? (
                      <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled />
                    ) : field.type === 'select' ? (
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled>
                        <option>Select...</option>
                        {field.options?.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <Input type={field.type} disabled />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-between items-center">
          <Button variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={loading}>
              {loading ? 'Creating...' : 'Publish Job'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

