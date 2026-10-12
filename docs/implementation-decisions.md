# Execution decisions and costs

These preserve the complete execution ledger decisions before removing its temporary workspace.

1. Use the existing dedicated Registrix repository and conversion branch as isolation. A second checkout would duplicate setup without isolating another project. Cost if wrong: edits affect the current Registrix checkout; other portfolio repositories remain separate.
2. Replace unavailable native bash ledger helpers with the Node equivalent, retaining briefs and completion gates. Cost: maintain an equivalent bookkeeping tool.
3. Hold unsupported source `BSED END` entries out instead of guessing `BSED ENG`. Cost: that group remains unavailable until curriculum confirmation.
4. Add subject-management APIs omitted by the plan's interface list, because the approved spec requires catalog management. Cost: additional interface and security-test surface.
5. Serialize writes with one transaction advisory lock to preserve atomic permission changes and final-admin protection. Cost: reduced throughput at larger scale.
6. Verify shared mutation hooks together with their task8 forms; bring synthetic Auth fixtures forward to task6. Cost: changed sequencing; no verification gate was waived.
7. Use audit Vite port5192 while normal port5190 stays configured for hosted Registrix. Cost: one additional reserved loopback port and separate audit server lifecycle.
8. Clear all private tab drafts/action references on a denied mutation or membership reduction, rather than infer still-valid scopes from incomplete membership information. Cost: other unsaved drafts/recovery references in that tab may also be discarded; confidentiality takes priority after a permission loss. Normal successful token refresh preserves drafts.
9. Hosted email/recovery/throttling remains owner-driven; verified account existence and administrator membership are established, automated fixture emails are not live evidence. Cost: provider delivery/configuration issues may still require owner testing.
10. Physical Safari/iOS and final HTTPS redirects remain pending actual-device/deployment checks. Cost: device-specific or hosting-only behavior may still require adjustment.
11. Retain the global lock despite unmeasured large-scale throughput, consistent with decision5 and portfolio scope. Cost: scaling needs measured lock partitioning and new concurrency verification.
12. Follow the approved recovered grade policy and withhold uncertain catalog mappings pending curriculum authority. Cost: institutional adoption requires separate policy/catalog approval.
13. Preserve the Studio Campus visual system while using actual summary data and a checklist instead of the prototype queue; report visual differences rather than claim pixel identity. Cost: the overview composition differs from the reference.

Deferred minor: add mixed-score cross-language halfway vectors. No functional grading discrepancy was identified; this is additional coverage, not a verified institutional policy.
