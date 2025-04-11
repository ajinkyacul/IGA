import * as schema from "@shared/schema";
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from "drizzle-orm";

// Create PostgreSQL connection pool with better configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  allowExitOnIdle: true
});

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const db = drizzle(pool, { schema });

// Initialize connection with retry logic
async function initializeConnection(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.connect();
      console.log('Database connected successfully');
      return;
    } catch (err) {
      console.error(`Connection attempt ${i + 1} failed:`, err);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Initialize default domains
async function initializeDefaultDomains() {
  const defaultDomains = [
    { name: 'Access Reviews', description: 'Access management and review questions', icon: 'security' },
    { name: 'Generic Governance', description: 'General governance and compliance questions', icon: 'gavel' },
    { name: 'Application Onboarding', description: 'New application integration questions', icon: 'app_registration' },
    { name: 'SOD', description: 'Segregation of Duties related questions', icon: 'people' },
    { name: 'AD & Directory Services', description: 'Active Directory and authentication questions', icon: 'folder_shared' }
  ];

  try {
    const existingDomains = await db.select().from(schema.domains);
    if (existingDomains.length === 0) {
      console.log('Initializing default domains...');
      await db.insert(schema.domains).values(defaultDomains);
      console.log('Default domains initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing default domains:', error);
  }
}

// Initialize connection and domains
initializeConnection()
  .then(() => initializeDefaultDomains())
  .catch(console.error);

class Storage {
  // User operations
  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0] as schema.User;
  }

  async getUser(id: number): Promise<schema.User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user || null;
  }

  async getUserByUsername(username: string): Promise<schema.User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user || null;
  }

  async getUsersByTenant(tenantId: number): Promise<schema.User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.tenantId, tenantId));
  }

  // Tenant operations  
  async createTenant(tenant: schema.InsertTenant): Promise<schema.Tenant> {
    const [result] = await db.insert(schema.tenants).values(tenant);
    return { ...tenant, id: result.insertId } as schema.Tenant;
  }

  async getTenant(id: number): Promise<schema.Tenant | null> {
    const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id));
    return tenant || null;
  }

  async getAllTenants(): Promise<schema.Tenant[]> {
    return await db.select().from(schema.tenants);
  }

  // Domain operations
  async createDomain(domain: schema.InsertDomain): Promise<schema.Domain> {
    const [result] = await db.insert(schema.domains).values(domain);
    return { ...domain, id: result.insertId } as schema.Domain;
  }

  async getAllDomains(): Promise<schema.Domain[]> {
    return await db.select().from(schema.domains);
  }

  // Question operations
  async createQuestion(question: schema.InsertQuestion): Promise<schema.Question> {
    const [result] = await db.insert(schema.questions).values(question);
    return { ...question, id: result.insertId } as schema.Question;
  }

  async getQuestion(id: number): Promise<schema.Question | null> {
    const [question] = await db.select().from(schema.questions).where(eq(schema.questions.id, id));
    return question || null;
  }

  async getAllQuestions(): Promise<schema.Question[]> {
    return await db.select().from(schema.questions);
  }

  async getQuestionsByDomain(domainId: number): Promise<schema.Question[]> {
    return await db.select().from(schema.questions).where(eq(schema.questions.domainId, domainId));
  }

  // TenantQuestion operations
  async createTenantQuestion(tenantQuestion: schema.InsertTenantQuestion): Promise<schema.TenantQuestion> {
    const [result] = await db.insert(schema.tenantQuestions).values(tenantQuestion);
    return { ...tenantQuestion, id: result.insertId } as schema.TenantQuestion;
  }

  async getTenantQuestion(id: number): Promise<schema.TenantQuestion | null> {
    const [tq] = await db.select().from(schema.tenantQuestions).where(eq(schema.tenantQuestions.id, id));
    return tq || null;
  }

  async getTenantQuestionByIds(tenantId: number, questionId: number): Promise<schema.TenantQuestion | null> {
    const [tq] = await db.select().from(schema.tenantQuestions)
      .where(and(
        eq(schema.tenantQuestions.tenantId, tenantId),
        eq(schema.tenantQuestions.questionId, questionId)
      ));
    return tq || null;
  }

  async getTenantQuestionsWithDetails(tenantId: number): Promise<any[]> {
    const tenantQuestions = await db.select().from(schema.tenantQuestions)
      .where(eq(schema.tenantQuestions.tenantId, tenantId));

    // Fetch questions for each tenant question
    const result = await Promise.all(tenantQuestions.map(async (tq) => {
      const question = await this.getQuestion(tq.questionId);
      return { ...tq, question };
    }));

    return result;
  }

  // Response operations
  async createResponse(response: schema.InsertResponse): Promise<schema.Response> {
    const [result] = await db.insert(schema.responses).values(response);
    return { ...response, id: result.insertId } as schema.Response;
  }

  async getResponse(id: number): Promise<schema.Response | null> {
    const [response] = await db.select().from(schema.responses).where(eq(schema.responses.id, id));
    return response || null;
  }

  async getResponsesByTenantQuestion(tenantQuestionId: number): Promise<schema.Response[]> {
    return await db.select().from(schema.responses)
      .where(eq(schema.responses.tenantQuestionId, tenantQuestionId));
  }

  async updateResponse(id: number, response: Partial<schema.InsertResponse>): Promise<schema.Response | null> {
    await db.update(schema.responses).set(response).where(eq(schema.responses.id, id));
    return this.getResponse(id);
  }

  async deleteResponse(id: number): Promise<boolean> {
    const result = await db.delete(schema.responses).where(eq(schema.responses.id, id));
    return result.rowsAffected > 0;
  }

  // Attachment operations (needs implementation)
  async createAttachment(attachment: schema.InsertAttachment): Promise<schema.Attachment> {
    throw new Error("Method not implemented.");
  }
  async getAttachment(id: number): Promise<schema.Attachment | null> {
    throw new Error("Method not implemented.");
  }
  async getAttachmentsByResponse(responseId: number): Promise<schema.Attachment[]> {
    throw new Error("Method not implemented.");
  }
  async deleteAttachment(id: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  // Dashboard data (needs implementation)
  async getTenantProgress(tenantId: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
}

export const storage = new Storage();