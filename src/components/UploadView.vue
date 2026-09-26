<script setup>
import { ref } from 'vue';
import {
  Upload,
  FileText,
  Calendar,
  User,
  Tag,
  Languages,
  Building2,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
} from 'lucide-vue-next';

const emit = defineEmits(['back', 'success']);

const selectedFile = ref(null);

const form = ref({
  title: '',
  revision: '',
  date: '',
  area: '',
  category: '',
  language: '',
  responsible: '',
  classification: '',
});

const errors = ref({});
const generalError = ref('');
const successMessage = ref('');
const isSubmitting = ref(false);

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const allowedExtensions = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
];

const handleFileChange = (event) => {
  const file = event.target.files[0];

  errors.value.file = '';
  generalError.value = '';
  successMessage.value = '';

  if (!file) {
    selectedFile.value = null;
    return;
  }

  const extension = '.' + file.name.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    selectedFile.value = null;

    errors.value.file = `Formato "${extension}" não permitido. Utilize PDF, DOC, DOCX, XLS ou XLSX.`;

    event.target.value = '';
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    selectedFile.value = null;

    errors.value.file =
      'O arquivo excede o tamanho máximo permitido de 20 MB.';

    event.target.value = '';
    return;
  }

  selectedFile.value = file;
};

const removeFile = () => {
  selectedFile.value = null;

  const input = document.querySelector('#document-file');

  if (input) {
    input.value = '';
  }

  errors.value.file = '';
};

const validateForm = () => {
  errors.value = {};

  if (!selectedFile.value) {
    errors.value.file = 'Selecione um arquivo para continuar.';
  }

  if (!form.value.title.trim()) {
    errors.value.title = 'Informe o título do documento.';
  }

  if (!form.value.revision.trim()) {
    errors.value.revision = 'Informe a revisão do documento.';
  }

  if (!form.value.date) {
    errors.value.date = 'Informe a data do documento.';
  }

  if (!form.value.area) {
    errors.value.area = 'Selecione a área responsável.';
  }

  if (!form.value.category) {
    errors.value.category = 'Selecione uma categoria.';
  }

  if (!form.value.language) {
    errors.value.language = 'Selecione o idioma.';
  }

  if (!form.value.responsible.trim()) {
    errors.value.responsible = 'Informe o responsável.';
  }

  if (!form.value.classification) {
    errors.value.classification =
      'Informe a classificação sugerida.';
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  generalError.value = '';
  successMessage.value = '';

  if (!validateForm()) {
    generalError.value =
      'Verifique os campos destacados antes de enviar o documento.';
    return;
  }

  isSubmitting.value = true;

  /*
   * ENVIO TEMPORÁRIO
   *
   * O backend ainda não possui a rota de upload.
   * Por isso, estamos simulando o envio.
   *
   * Quando o endpoint existir, esta parte será
   * substituída pela chamada fetch/FormData.
   */
  await new Promise((resolve) => setTimeout(resolve, 1000));

  isSubmitting.value = false;

  successMessage.value =
    'Documento enviado com sucesso! O documento está aguardando validação.';

  emit('success');
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
</script>

<template>
  <div class="upload-page fade-in">
    <!-- Cabeçalho -->
    <header class="upload-header">
      <button
        type="button"
        class="back-button"
        @click="emit('back')"
      >
        <ArrowLeft :size="18" />
        <span>Voltar ao painel</span>
      </button>

      <div class="upload-title">
        <div class="upload-title-icon">
          <Upload :size="22" />
        </div>

        <div>
          <h1>Enviar documento</h1>

          <p>
            Cadastre um novo documento técnico no AkaVision.
          </p>
        </div>
      </div>
    </header>

    <!-- Erro geral -->
    <div
      v-if="generalError"
      class="alert alert-error"
    >
      <AlertCircle :size="18" />

      <span>{{ generalError }}</span>
    </div>

    <!-- Sucesso -->
    <div
      v-if="successMessage"
      class="alert alert-success"
    >
      <CheckCircle2 :size="18" />

      <div>
        <strong>Envio concluído</strong>

        <span>{{ successMessage }}</span>
      </div>
    </div>

    <form
      class="upload-form"
      @submit.prevent="handleSubmit"
    >
      <!-- ARQUIVO -->
      <section class="form-section">
        <div class="section-heading">
          <FileText :size="19" />

          <div>
            <h2>Arquivo</h2>

            <p>
              Selecione o documento técnico que será enviado.
            </p>
          </div>
        </div>

        <label
          for="document-file"
          class="file-upload-area"
        >
          <Upload :size="32" />

          <strong>Selecione o arquivo</strong>

          <span>
            PDF, DOC, DOCX, XLS ou XLSX — máximo de 20 MB
          </span>

          <input
            id="document-file"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            @change="handleFileChange"
          />
        </label>

        <!-- Arquivo selecionado -->
        <div
          v-if="selectedFile"
          class="selected-file"
        >
          <div class="selected-file-info">
            <FileText :size="20" />

            <div>
              <strong>
                {{ selectedFile.name }}
              </strong>

              <span>
                {{ formatFileSize(selectedFile.size) }}
              </span>
            </div>
          </div>

          <button
            type="button"
            class="remove-file-button"
            title="Remover arquivo"
            @click="removeFile"
          >
            <X :size="17" />
          </button>
        </div>

        <!-- Erro do arquivo -->
        <span
          v-if="errors.file"
          class="field-error"
        >
          <AlertCircle :size="14" />

          {{ errors.file }}
        </span>
      </section>

      <!-- INFORMAÇÕES -->
      <section class="form-section">
        <div class="section-heading">
          <FileText :size="19" />

          <div>
            <h2>Informações do documento</h2>

            <p>
              Preencha os dados de identificação do documento.
            </p>
          </div>
        </div>

        <div class="form-grid">
          <!-- TÍTULO -->
          <div class="form-field full-width">
            <label for="title">
              Título *
            </label>

            <input
              id="title"
              v-model="form.title"
              type="text"
              placeholder="Ex.: Manual de Manutenção do Gripen NG"
              :class="{ 'input-error': errors.title }"
            />

            <span
              v-if="errors.title"
              class="field-error"
            >
              {{ errors.title }}
            </span>
          </div>

          <!-- REVISÃO -->
          <div class="form-field">
            <label for="revision">
              <GitBranch :size="15" />

              Revisão *
            </label>

            <input
              id="revision"
              v-model="form.revision"
              type="text"
              placeholder="Ex.: Rev. 01"
              :class="{ 'input-error': errors.revision }"
            />

            <span
              v-if="errors.revision"
              class="field-error"
            >
              {{ errors.revision }}
            </span>
          </div>

          <!-- DATA -->
          <div class="form-field">
            <label for="date">
              <Calendar :size="15" />

              Data *
            </label>

            <input
              id="date"
              v-model="form.date"
              type="date"
              :class="{ 'input-error': errors.date }"
            />

            <span
              v-if="errors.date"
              class="field-error"
            >
              {{ errors.date }}
            </span>
          </div>

          <!-- ÁREA -->
          <div class="form-field">
            <label for="area">
              <Building2 :size="15" />

              Área *
            </label>

            <select
              id="area"
              v-model="form.area"
              :class="{ 'input-error': errors.area }"
            >
              <option value="">
                Selecione uma área
              </option>

              <option value="Engenharia">
                Engenharia
              </option>

              <option value="Qualidade">
                Qualidade
              </option>

              <option value="Manutenção">
                Manutenção
              </option>

              <option value="Produção">
                Produção
              </option>

              <option value="Logística">
                Logística
              </option>

              <option value="Projetos">
                Projetos
              </option>
            </select>

            <span
              v-if="errors.area"
              class="field-error"
            >
              {{ errors.area }}
            </span>
          </div>

          <!-- CATEGORIA -->
          <div class="form-field">
            <label for="category">
              <Tag :size="15" />

              Categoria *
            </label>

            <select
              id="category"
              v-model="form.category"
              :class="{ 'input-error': errors.category }"
            >
              <option value="">
                Selecione uma categoria
              </option>

              <option value="Aeroestrutura">
                Aeroestrutura
              </option>

              <option value="Sistemas Críticos">
                Sistemas Críticos
              </option>

              <option value="Manutenção">
                Manutenção
              </option>

              <option value="Logística">
                Logística
              </option>

              <option value="Documentação Técnica">
                Documentação Técnica
              </option>
            </select>

            <span
              v-if="errors.category"
              class="field-error"
            >
              {{ errors.category }}
            </span>
          </div>

          <!-- IDIOMA -->
          <div class="form-field">
            <label for="language">
              <Languages :size="15" />

              Idioma *
            </label>

            <select
              id="language"
              v-model="form.language"
              :class="{ 'input-error': errors.language }"
            >
              <option value="">
                Selecione um idioma
              </option>

              <option value="Português">
                Português
              </option>

              <option value="Inglês">
                Inglês
              </option>

              <option value="Espanhol">
                Espanhol
              </option>
            </select>

            <span
              v-if="errors.language"
              class="field-error"
            >
              {{ errors.language }}
            </span>
          </div>

          <!-- RESPONSÁVEL -->
          <div class="form-field">
            <label for="responsible">
              <User :size="15" />

              Responsável *
            </label>

            <input
              id="responsible"
              v-model="form.responsible"
              type="text"
              placeholder="Nome do responsável"
              :class="{ 'input-error': errors.responsible }"
            />

            <span
              v-if="errors.responsible"
              class="field-error"
            >
              {{ errors.responsible }}
            </span>
          </div>

          <!-- CLASSIFICAÇÃO -->
          <div class="form-field full-width">
            <label for="classification">
              <Tag :size="15" />

              Classificação sugerida *
            </label>

            <select
              id="classification"
              v-model="form.classification"
              :class="{ 'input-error': errors.classification }"
            >
              <option value="">
                Selecione uma classificação
              </option>

              <option value="Público">
                Público
              </option>

              <option value="Interno">
                Interno
              </option>

              <option value="Confidencial">
                Confidencial
              </option>

              <option value="Restrito">
                Restrito
              </option>
            </select>

            <span
              v-if="errors.classification"
              class="field-error"
            >
              {{ errors.classification }}
            </span>
          </div>
        </div>
      </section>

      <!-- RODAPÉ -->
      <div class="form-footer">
        <span class="required-info">
          * Campos obrigatórios
        </span>

        <div class="footer-actions">
          <button
            type="button"
            class="cancel-button"
            @click="emit('back')"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="submit-button"
            :disabled="isSubmitting"
          >
            <Upload
              v-if="!isSubmitting"
              :size="17"
            />

            <span>
              {{
                isSubmitting
                  ? 'Enviando...'
                  : 'Enviar documento'
              }}
            </span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.upload-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 2.5rem;
  color: #0f172a;
}

.upload-header {
  margin-bottom: 1.5rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.25rem;
}

.back-button:hover {
  color: #7e22ce;
}

.upload-title {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.upload-title-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #f3e8ff;
  color: #7e22ce;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-title h1 {
  margin: 0 0 0.2rem;
  font-size: 1.65rem;
}

.upload-title p {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  border-radius: 9px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert-success div {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.upload-form {
  max-width: 1000px;
}

.form-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  margin-bottom: 1.3rem;
  color: #7e22ce;
}

.section-heading h2 {
  margin: 0 0 0.2rem;
  font-size: 1rem;
  color: #0f172a;
}

.section-heading p {
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
}

.file-upload-area {
  min-height: 170px;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  color: #7e22ce;
  cursor: pointer;
  transition: 0.2s;
}

.file-upload-area:hover {
  border-color: #7e22ce;
  background: #faf5ff;
}

.file-upload-area strong {
  color: #334155;
  font-size: 0.95rem;
}

.file-upload-area span {
  color: #94a3b8;
  font-size: 0.75rem;
}

.file-upload-area input {
  display: none;
}

.selected-file {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.8rem;
  padding: 0.8rem 1rem;
  border-radius: 9px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.selected-file-info {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: #7e22ce;
}

.selected-file-info div {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.selected-file-info strong {
  color: #334155;
  font-size: 0.82rem;
}

.selected-file-info span {
  color: #94a3b8;
  font-size: 0.72rem;
}

.remove-file-button {
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.remove-file-button:hover {
  color: #dc2626;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
}

.form-field input,
.form-field select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.7rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.85rem;
  outline: none;
}

.form-field input:focus,
.form-field select:focus {
  border-color: #7e22ce;
  box-shadow: 0 0 0 3px rgba(126, 34, 206, 0.08);
}

.input-error {
  border-color: #ef4444 !important;
}

.field-error {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #dc2626;
  font-size: 0.72rem;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0 2rem;
}

.required-info {
  color: #94a3b8;
  font-size: 0.75rem;
}

.footer-actions {
  display: flex;
  gap: 0.7rem;
}

.cancel-button,
.submit-button {
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1.1rem;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.cancel-button {
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.submit-button {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: #7e22ce;
  color: #ffffff;
}

.submit-button:hover {
  background: #6b21a8;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .upload-page {
    padding: 1.25rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .form-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .footer-actions {
    justify-content: flex-end;
  }
}
</style>