import { supabase } from '@/lib/supabase';

export interface ChatMessage {
    id: string;
    appointment_id: string;
    sender_id: string;
    content: string;
    type: 'text' | 'image' | 'file';
    media_url?: string;
    created_at: string;
    is_read: boolean;
}

export interface ChatPreview {
    appointment_id: string;
    doctor_id: string;
    patient_id: string;
    patient_name: string;
    patient_avatar?: string;
    last_message?: string;
    last_message_time?: string;
    last_message_type?: string;
    unread_count: number;
}

export const chatService = {
    async getDoctorId(userId: string) {

        const { data, error } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (error) return null;
        return data.id;
    },

    async getInboxChats(doctorId: string) {

        const { data, error } = await supabase
            .from('doctor_inbox_view')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('last_message_time', { ascending: false });

        if (error) throw error;
        return data as ChatPreview[];
    },

    async getMessages(appointmentId: string) {

        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('appointment_id', appointmentId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ChatMessage[];
    },

    async sendMessage(appointmentId: string, senderId: string, content: string, type: 'text' | 'image' | 'file' = 'text', mediaUrl?: string) {

        const { data, error } = await supabase
            .from('messages')
            .insert({
                appointment_id: appointmentId,
                sender_id: senderId,
                content: content,
                type: type,
                media_url: mediaUrl
            })
            .select()
            .single();

        if (error) throw error;
        return data as ChatMessage;
    },

    async markAsRead(appointmentId: string, userId: string) {

        // Mark messages as read where sender is NOT the current user (i.e. incoming messages)
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('appointment_id', appointmentId)
            .neq('sender_id', userId)
            .eq('is_read', false);

        if (error) throw error;
    },

    getAttachmentUrl(path: string) {

        return supabase.storage.from('chat-attachments').getPublicUrl(path).data.publicUrl;
    },

    async uploadAttachment(file: File) {

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        return this.getAttachmentUrl(filePath);
    },

    async getPatientInbox(patientId: string) {
        const { data, error } = await supabase
            .from('patient_inbox_view')
            .select('*')
            .eq('patient_id', patientId)
            // Sort by latest activity (message or creation)
            .order('latest_activity_at', { ascending: false });

        if (error) throw error;
        return data as PatientChatPreview[];
    }
};

export interface PatientChatPreview {
    appointment_id: string;
    appointment_created_at: string;
    doctor_id: string;
    patient_id: string;
    doctor_name: string;
    doctor_avatar?: string;
    last_message?: string;
    last_message_time?: string;
    last_message_type?: string;
    unread_count: number;
    latest_activity_at: string;
}
