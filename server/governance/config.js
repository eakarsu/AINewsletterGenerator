module.exports={
 caseType:'versioned_newsletter_release',initialState:'sources_registered',
 states:['sources_registered','rights_locked','draft_edited','render_queued','rendered','quality_review','send_approved','publish_queued','published','exported'],
 createRoles:['editor','campaign_manager'],assessmentRoles:['editor','quality_reviewer','accessibility_reviewer','brand_reviewer'],auditRoles:['campaign_manager','compliance_reviewer','auditor'],connectorRoles:['integration_operator','campaign_manager'],
 evidenceKinds:['source_manifest','rights_consent_manifest','asset_manifest','draft_version','render_job_receipt','render_manifest','link_check_report','accessibility_report','brand_moderation_report','translation_report','send_time_evaluation','approval_record','publish_receipt','export_manifest','usage_record'],
 requiredSignals:['sourceVersion','draftVersion','renderVersion','rightsStatus','consentStatus','linkStatus','accessibilityStatus','brandStatus','exportProfile','policyVersion'],
 professionalBoundary:'Generated newsletter content and send-time suggestions are drafts; editors, rights/privacy reviewers, and campaign owners approve every release.',
 connectors:[{name:'media_model_provider',purpose:'draft/render receipts only'},{name:'rights_library',purpose:'license evidence'},{name:'object_storage_cdn',purpose:'asset pointers'},{name:'translation',purpose:'localized version receipts'},{name:'email_publisher',purpose:'signed campaign receipts'},{name:'usage_accounting',purpose:'provider/send usage'}],
 transitions:[
  {from:'sources_registered',action:'lock_rights',to:'rights_locked',roles:['editor','compliance_reviewer'],requiresEvidence:true},
  {from:'rights_locked',action:'lock_draft',to:'draft_edited',roles:['editor'],requiresEvidence:true},
  {from:'draft_edited',action:'queue_render',to:'render_queued',roles:['editor'],requiresEvidence:true},
  {from:'render_queued',action:'record_render',to:'rendered',roles:['integration_operator'],requiresEvidence:true},
  {from:'rendered',action:'review_quality',to:'quality_review',roles:['quality_reviewer','accessibility_reviewer','brand_reviewer'],requiresEvidence:true,dualControl:true},
  {from:'quality_review',action:'approve_send',to:'send_approved',roles:['campaign_manager','compliance_reviewer'],requiresEvidence:true,dualControl:true},
  {from:'send_approved',action:'queue_publish',to:'publish_queued',roles:['campaign_manager'],requiresEvidence:true,dualControl:true},
  {from:'publish_queued',action:'record_publish',to:'published',roles:['integration_operator'],requiresEvidence:true},
  {from:'send_approved',action:'record_export',to:'exported',roles:['editor'],requiresEvidence:true,dualControl:true}
 ],
 assess:x=>{const ready=x.rightsStatus==='verified'&&x.consentStatus==='verified'&&x.linkStatus==='passed'&&x.accessibilityStatus==='passed'&&x.brandStatus==='passed'&&['html_email','accessible_pdf','web_archive'].includes(x.exportProfile);return{disposition:ready?'human_send_review_required':'rights_quality_or_delivery_hold',sendCommand:null,sendTimeDecision:null,versions:{source:x.sourceVersion,draft:x.draftVersion,render:x.renderVersion}};}
};
