module.exports = {
  resources: [
    {
      kind: 'pod',
      api: 'api/v1/pods'
    },
    {
      kind: 'service',
      api: 'api/v1/services'
    },
    {
      kind: 'ingress',
      api: 'apis/networking.k8s.io/v1/ingresses'
    },
    {
      kind: 'secret',
      api: 'api/v1/secrets'
    },
    {
      kind: 'configmap',
      api: 'api/v1/configmaps'
    },
    {
      kind: 'deployment',
      api: 'apis/apps/v1/deployments'
    },
    {
      kind: 'statefulset',
      api: 'apis/apps/v1/statefulsets'
    },
    {
      kind: 'daemonset',
      api: 'apis/apps/v1/daemonsets'
    },
    {
      kind: 'job',
      api: 'apis/batch/v1/jobs'
    },
    {
      kind: 'cronjob',
      api: 'apis/batch/v1beta1/cronjobs'
    },
    {
      kind: 'ingress',
      api: 'apis/extensions/v1beta1/ingresses'
    },
    {
      kind: 'networkpolicy',
      api: 'apis/networking.k8s.io/v1/networkpolicies'
    },
    {
      kind: 'persistentvolumeclaim',
      api: 'api/v1/persistentvolumeclaims'
    },
    {
      kind: 'persistentvolume',
      api: 'api/v1/persistentvolumes'
    },
    {
      kind: 'storageclass',
      api: 'api/v1/storageclasses'
    },
    {
      kind: 'clusterrole',
      api: 'rbac.authorization.k8s.io/v1/clusterroles'
    },
    {
      kind: 'clusterrolebinding',
      api: 'rbac.authorization.k8s.io/v1/clusterrolebindings'
    },
    {
      kind: 'role',
      api: 'rbac.authorization.k8s.io/v1/roles'
    },
    {
      kind: 'rolebinding',
      api: 'rbac.authorization.k8s.io/v1/rolebindings'
    },
    {
      kind: 'customresourcedefinition',
      api: 'apis/apiextensions.k8s.io/v1beta1/customresourcedefinitions'
    }
  ]
}
