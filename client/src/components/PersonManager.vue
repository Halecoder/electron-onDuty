<template>
  <div class="person-manager">
    <div class="panel-header">
      <h3>人员信息</h3>
      <el-button type="primary" @click="showAddDialog" :icon="Plus"> 添加人员 </el-button>
    </div>

    <el-table :data="persons" border style="width: 100%; margin-top: 20px">
      <el-table-column prop="order" label="顺序" width="80" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column label="操作" width="200" align="center">
        <template #default="scope">
          <el-button size="small" type="primary" @click="editPerson(scope.row)" :icon="EditPen">
            编辑
          </el-button>
          <el-button size="small" type="danger" @click="deletePerson(scope.row)" :icon="Delete">
            删除
          </el-button>
          <el-button
            size="small"
            @click="moveUp(scope.$index)"
            :disabled="scope.$index === 0"
            :icon="Top"
          >
            上移
          </el-button>
          <el-button
            size="small"
            @click="moveDown(scope.$index)"
            :disabled="scope.$index === persons.length - 1"
            :icon="Bottom"
          >
            下移
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingPerson ? '编辑人员' : '添加人员'"
      width="500px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePerson">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Top, Bottom, Delete, EditPen } from '@element-plus/icons-vue'
import { Person } from '../types'

const props = defineProps<{
  persons: Person[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

const dialogVisible = ref(false)
const editingPerson = ref<Person | null>(null)
const form = reactive({
  name: '',
  email: ''
})

function showAddDialog() {
  editingPerson.value = null
  form.name = ''
  form.email = ''
  dialogVisible.value = true
}

async function savePerson() {
  if (!form.name || !form.email) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    if (editingPerson.value) {
      // 编辑模式
      await window.api.updatePerson({
        ...editingPerson.value,
        name: form.name,
        email: form.email
      })
      ElMessage.success('修改成功')
    } else {
      // 添加模式
      const maxOrder = props.persons.length > 0
        ? Math.max(...props.persons.map(p => p.order))
        : 0
      await window.api.addPerson({
        name: form.name,
        email: form.email,
        order: maxOrder + 1
      })
      ElMessage.success('添加成功')
    }

    dialogVisible.value = false
    emit('refresh')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function deletePerson(person: Person) {
  try {
    await ElMessageBox.confirm('确定要删除该人员吗？', '提示', {
      type: 'warning'
    })

    await window.api.deletePerson(person.id)
    ElMessage.success('删除成功')
    emit('refresh')
  } catch (error) {
    // 用户取消
  }
}


// 添加编辑函数
function editPerson(person: Person) {
  editingPerson.value = person
  form.name = person.name
  form.email = person.email
  dialogVisible.value = true
}


async function moveUp(index: number) {
  const person1 = props.persons[index]
  const person2 = props.persons[index - 1]

  await window.api.updatePerson({ ...person1, order: person2.order })
  await window.api.updatePerson({ ...person2, order: person1.order })

  emit('refresh')
}

async function moveDown(index: number) {
  const person1 = props.persons[index]
  const person2 = props.persons[index + 1]

  await window.api.updatePerson({ ...person1, order: person2.order })
  await window.api.updatePerson({ ...person2, order: person1.order })

  emit('refresh')
}
</script>

<style scoped>
.person-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 18px;
  color: #333;
}
</style>
